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
import { MessageSquare, Lock, Mail, User, CheckCircle2, ArrowRight } from "lucide-react";
import { getCsrfToken } from "@/utils/auth";
import logger from "@/utils/logger";

// Create form schema with validation rules
const signupFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters",
  }),
  email: z.string().email({
    message: "Please enter a valid email address",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters",
  }).refine(
    (password) => /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password),
    {
      message: "Password must contain uppercase, lowercase, and numbers",
    }
  ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupFormSchema>;

const SignupForm = () => {
  const { register: authRegister, isLoading, error, errors, clearError } = useAuth();
  const navigate = useNavigate();
  const isSubmittingRef = useRef(false);
  const { toast } = useToast();

  // Set up the form with React Hook Form
  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Update form errors when backend errors change
  useEffect(() => {
    if (errors) {
      // Set errors from backend to the form state
      Object.entries(errors).forEach(([field, messages]) => {
        if (field === 'email' || field === 'name' || field === 'password') {
          form.setError(field as any, {
            type: 'backend',
            message: messages[0],
          });
        }
      });
    }
  }, [errors, form]);

  const onSubmit = async (values: SignupFormValues) => {
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

      // Get CSRF token before submission
      await getCsrfToken();

      logger.info("Attempting to register user");
      const success = await authRegister(values.name, values.email, values.password);

      if (success) {
        logger.info("Registration successful, navigating to home");
        toast({
          title: "Account created!",
          description: "You've been successfully registered",
          variant: "default",
          className: "bg-green-500 text-white",
        });
        navigate("/");
      } else {
        toast({
          title: "Registration failed",
          description: "Please try again",
          variant: "destructive",
        });
      }
    } catch (err) {
      logger.error("Registration error:", err);
      toast({
        title: "Registration error",
        description: "An error occurred during registration",
        variant: "destructive",
      });
    } finally {
      // Reset submission flag with delay to prevent repeated submissions
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
          <h1 className="text-4xl font-bold mb-6">The Last Lab</h1>
          <p className="text-xl mb-8 max-w-md text-center">
            Join our platform and start creating intelligent chat applications today.
          </p>

          <div className="space-y-4 max-w-md">
            <div className="flex items-center">
              <CheckCircle2 className="h-6 w-6 mr-3 text-green-300" />
              <p>Customizable AI chat widgets</p>
            </div>
            <div className="flex items-center">
              <CheckCircle2 className="h-6 w-6 mr-3 text-green-300" />
              <p>Knowledge base integration</p>
            </div>
            <div className="flex items-center">
              <CheckCircle2 className="h-6 w-6 mr-3 text-green-300" />
              <p>Advanced context management</p>
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
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Create your account</h2>
            <p className="text-gray-600">
              Let's get started with your new account
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
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          placeholder="Enter your name"
                          className="pl-10"
                          {...field}
                        />
                      </FormControl>
                      <div className="absolute left-3 top-3 text-gray-400">
                        <User size={16} />
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                          placeholder="Create a secure password"
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

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          placeholder="Confirm your password"
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

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || isSubmittingRef.current}
              >
                {isLoading || isSubmittingRef.current ? (
                  <span className="flex items-center">
                    <span className="animate-spin mr-2">⊝</span>
                    Creating Account...
                  </span>
                ) : (
                  <span className="flex items-center">
                    Create Account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </span>
                )}
              </Button>

              <div className="text-center mt-6">
                <p className="text-sm text-gray-600">
                  Already have an account?{" "}
                  <Link to="/login" className="text-primary font-medium hover:underline">
                    Log in
                  </Link>
                </p>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default SignupForm;
