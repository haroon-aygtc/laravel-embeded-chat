import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import logger from '@/utils/logger';
import { AuthService } from '@/services/authService';
import { Mail, MessageSquare } from 'lucide-react';
import { LockClosedIcon } from '@radix-ui/react-icons';
import { useAuth } from '@/context/AuthContext';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage
} from "@/components/ui/form";
import LoadingSpinner from "@/components/ui/loading-spinner";

// Type for the form

const authService = AuthService.getInstance();

// Create form schema with validation rules
const loginFormSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address",
  }).trim().toLowerCase(),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters",
  }),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

const LoginForm = () => {
  const { login, isLoading, errors, clearError, user } = useAuth();
  const navigate = useNavigate();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const isSubmittingRef = useRef(false);
  const [showFormErrors, setShowFormErrors] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

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

  const onSubmit = async (values: LoginFormValues, event?: React.BaseSyntheticEvent) => {
    try {
      // Prevent browser's default form submission
      if (event) {
        event.preventDefault();
      }

      // Prevent multiple submissions
      if (isSubmittingRef.current || isLoading) {
        logger.warn("Preventing duplicate form submission");
        return;
      }

      // Clear any previous errors
      clearError();
      form.clearErrors();

      // Show validation errors if any
      setShowFormErrors(true);

      // Set submission flag
      isSubmittingRef.current = true;

      console.log("Starting login process...");

      console.log("Attempting login with credentials...");
      const success = await login(values.email, values.password);

      if (success) {
        // Reset form after successful login
        form.reset();
        setShowFormErrors(false);

        // Log the success
        console.log("Login successful - preparing to redirect");

        // First check if user has admin role
        const currentUser = authService.getUser();
        if (currentUser && currentUser.role === 'admin') {
          navigate('/admin/dashboard', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }

        toast({
          title: "Login successful",
          description: "Welcome back!",
          variant: "default",
          className: "bg-green-500 text-white",
        });
      } else {
        // Handle login failure
        const errorMessage = error ? error.toString() : "Please check your credentials and try again";
        toast({
          title: "Login failed",
          description: errorMessage,
          variant: "destructive",
        });
        form.setError('root', {
          type: 'manual',
          message: errorMessage
        });
      }
    } catch (err: any) {
      logger.error("Login error:", err);
      const errorMessage = err?.message || "An unexpected error occurred during login";
      toast({
        title: "Login error",
        description: errorMessage,
        variant: "destructive",
      });
      form.setError('root', {
        type: 'manual',
        message: errorMessage
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
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-primary/90 to-transparent"></div>
      </div>

      {/* Right column - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8 bg-white rounded-lg shadow-lg p-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Sign in to your account
            </h2>
          </div>
          <Form {...form}>
            <form className="mt-8 space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="rounded-md shadow-sm -space-y-px">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          placeholder="Enter your password"
                          type="password"
                          className="pl-10"
                          {...field}
                        />
                      </FormControl>
                      <div className="absolute left-3 top-3 text-gray-400">
                        <LockClosedIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <a href="/forgot-password" className="font-medium text-primary hover:text-primary-dark">
                    Forgot your password?
                  </a>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmittingRef.current || isLoading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    <LockClosedIcon className="h-5 w-5 text-primary-500 group-hover:text-primary-400" aria-hidden="true" />
                  </span>
                  {isLoading ? (
                    <>
                      <LoadingSpinner className="h-5 w-5 mr-2" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <span>Sign in</span>
                  )}
                </button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
