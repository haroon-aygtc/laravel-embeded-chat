import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import {
  MessageSquare,
  Lock,
  Mail,
  LogIn,
  ShieldCheck,
  Shield
} from "lucide-react";
import { getCsrfToken } from "@/utils/auth";
import logger from "@/utils/logger";

// Create form schema with validation rules
const loginFormSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address",
  }),
  password: z.string().min(1, {
    message: "Password is required",
  }),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

const LoginForm = () => {
  const { login, isLoading, error, errors, clearError } = useAuth();
  const navigate = useNavigate();
  const isSubmittingRef = useRef(false);
  const { toast } = useToast();

  // Set up the form with React Hook Form
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Update form errors when backend errors change
  useEffect(() => {
    if (errors) {
      // Set errors from backend to the form state
      Object.entries(errors).forEach(([field, messages]) => {
        if (field === 'email' || field === 'password') {
          form.setError(field as any, {
            type: 'backend',
            message: messages[0],
          });
        }
      });
    }
  }, [errors, form]);

  const onSubmit = async (values: LoginFormValues) => {
    // Prevent multiple submissions
    if (isSubmittingRef.current || isLoading) {
      logger.warn("Preventing duplicate form submission");
      return;
    }

    // Clear any previous errors
    clearError();

    try {
      // Set submission flag
      isSubmittingRef.current = true;

      // Get CSRF token first
      await getCsrfToken();

      const success = await login(values.email, values.password);
      if (success) {
        toast({
          title: "Login successful",
          description: "Welcome back to the Last Lab!",
          variant: "default",
          className: "bg-green-500 text-white",
        });
        navigate("/admin/dashboard");
      } else {
        toast({
          title: "Login failed",
          description: "Please check your credentials and try again",
          variant: "destructive",
        });
      }
    } catch (err) {
      logger.error("Login error:", err);
      toast({
        title: "Login error",
        description: "An error occurred during login",
        variant: "destructive",
      });
    } finally {
      // Reset submission flag with delay
      setTimeout(() => {
        isSubmittingRef.current = false;
      }, 2000);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left column - Branding/Illustration */}
      <div className="hidden md:flex md:w-1/2 bg-primary/90 flex-col justify-center items-center text-white p-10 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-center mb-8">
            <MessageSquare className="h-16 w-16" />
          </div>
          <h1 className="text-4xl font-bold mb-6">Welcome Back</h1>
          <p className="text-xl mb-8 max-w-md text-center">
            Sign in to continue managing your chat widgets and AI applications.
          </p>

          <div className="space-y-4 max-w-md">
            <div className="flex items-center">
              <ShieldCheck className="h-6 w-6 mr-3 text-green-300" />
              <p>Secure admin dashboard</p>
            </div>
            <div className="flex items-center">
              <Shield className="h-6 w-6 mr-3 text-green-300" />
              <p>Privacy & security controls</p>
            </div>
            <div className="flex items-center">
              <MessageSquare className="h-6 w-6 mr-3 text-green-300" />
              <p>Chat analytics and reporting</p>
            </div>
          </div>
        </div>

        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 right-0 h-40 bg-white/10"></div>
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-white/10"></div>
          <div className="absolute inset-0 grid grid-cols-3 gap-1">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="bg-white/5 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>

      {/* Right column - Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Log in to your account</h2>
            <p className="text-gray-600">
              Enter your credentials to access the dashboard
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 border border-red-200 bg-red-50 text-red-700 rounded-lg">
              {typeof error === "object" ? JSON.stringify(error) : error}
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          placeholder="you@example.com"
                          type="email"
                          className="pl-10"
                          {...field}
                        />
                      </FormControl>
                      <div className="absolute left-3 top-3 text-gray-400">
                        <Mail size={16} />
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          placeholder="Enter your password"
                          type="password"
                          className="pl-10"
                          {...field}
                        />
                      </FormControl>
                      <div className="absolute left-3 top-3 text-gray-400">
                        <Lock size={16} />
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || isSubmittingRef.current}
              >
                {isLoading || isSubmittingRef.current ? (
                  <span className="flex items-center">
                    <span className="animate-spin mr-2">⊝</span>
                    Logging in...
                  </span>
                ) : (
                  <span className="flex items-center">
                    Login
                    <LogIn className="ml-2 h-4 w-4" />
                  </span>
                )}
              </Button>

              <div className="text-center mt-6">
                <p className="text-sm text-gray-600">
                  Don't have an account?{" "}
                  <Link to="/signup" className="text-primary font-medium hover:underline">
                    Create an account
                  </Link>
                </p>
              </div>

              {/* Demo credentials info */}
              <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Demo Credentials</h4>
                <div className="text-sm text-gray-600">
                  Email: <span className="font-medium">admin@example.com</span><br />
                  Password: <span className="font-medium">admin123</span>
                </div>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
