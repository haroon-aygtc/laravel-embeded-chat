import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import logger from '@/utils/logger';
import { AuthService } from '@/services/authService';
import { Mail, MessageSquare, Eye, EyeOff } from 'lucide-react';
import { LockClosedIcon } from '@radix-ui/react-icons';
import { useAuth } from '@/context/AuthContext';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
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
  const { login, isLoading, errors, clearError } = useAuth();
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
  const [showPassword, setShowPassword] = useState(false);
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
      setError(null);

      // Show validation errors if any
      setShowFormErrors(true);

      // Set submission flag
      isSubmittingRef.current = true;

      console.log("Starting login process...");
      console.log("Attempting login with credentials...");

      // Make login request
      const success = await login(values.email, values.password);
      console.log("Login API response success flag:", success);

      // Additional check - log the current user right after login attempt
      const userAfterLogin = authService.getUser();
      console.log("User after login attempt:", userAfterLogin);

      if (success) {
        // Reset form after successful login
        form.reset();
        setShowFormErrors(false);

        // Log the success
        console.log("Login successful - preparing to redirect");

        // First check if user has admin role
        const currentUser = authService.getUser();
        console.log("Current user after login:", currentUser);

        // Show success toast
        toast({
          title: "Login successful",
          description: "Welcome back!",
          variant: "default",
          className: "bg-green-500 text-white",
        });

        // Check if there's a redirect path stored in session storage
        const redirectPath = sessionStorage.getItem('redirectAfterLogin');

        if (redirectPath) {
          console.log("Redirecting to stored path:", redirectPath);
          // Clear the stored path
          sessionStorage.removeItem('redirectAfterLogin');
          navigate(redirectPath, { replace: true });
        } else if (currentUser && currentUser.role === 'admin') {
          console.log("Redirecting to admin dashboard");
          navigate('/admin/dashboard', { replace: true });
        } else {
          console.log("Redirecting to user dashboard");
          navigate('/dashboard', { replace: true });
        }
      } else {
        // Handle login failure - this will only execute if the login function returned false
        console.log("Login failed in component");
        const errorMessage = error || "Please check your credentials and try again";

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
    } catch (err) {
      // Handle any unexpected errors in the component itself
      console.error("Unexpected error during login:", err);
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";

      toast({
        title: "Login error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      // Clear submission flag
      isSubmittingRef.current = false;
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
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
          <div className="mb-8">
            <h2 className="text-center text-2xl md:text-3xl font-bold text-gray-900">
              Sign in to your account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Enter your credentials to access your dashboard
            </p>
          </div>

          <Form {...form}>
            <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Email address
                        </FormLabel>
                      </div>
                      <div className="relative mt-1">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                          <Mail size={16} />
                        </div>
                        <FormControl>
                          <Input
                            placeholder="you@example.com"
                            type="email"
                            className="pl-10 h-11 rounded-md border-gray-300 focus:border-primary focus:ring-primary"
                            {...field}
                          />
                        </FormControl>
                      </div>
                      <FormMessage className="text-xs mt-1" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Password
                        </FormLabel>
                      </div>
                      <div className="relative mt-1">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                          <LockClosedIcon className="h-4 w-4" aria-hidden="true" />
                        </div>
                        <FormControl>
                          <Input
                            placeholder="Enter your password"
                            type={showPassword ? "text" : "password"}
                            className="pl-10 pr-10 h-11 rounded-md border-gray-300 focus:border-primary focus:ring-primary"
                            {...field}
                          />
                        </FormControl>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <FormMessage className="text-xs mt-1" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex items-center justify-between mt-6">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <a href="/forgot-password" className="font-medium text-primary hover:text-primary-dark transition-colors">
                    Forgot password?
                  </a>
                </div>
              </div>

              <div className="mt-8">
                <button
                  type="submit"
                  disabled={isSubmittingRef.current || isLoading}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary hover:bg-primary-dark transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-sm"
                >
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

              <div className="mt-6 text-center text-sm">
                <span className="text-gray-600">Don't have an account?</span>{" "}
                <a href="/signup" className="font-medium text-primary hover:text-primary-dark transition-colors">
                  Sign up
                </a>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
