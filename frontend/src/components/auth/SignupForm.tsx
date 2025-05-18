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
import { MessageSquare, Lock, Mail, User, CheckCircle2, ArrowRight, Eye, EyeOff } from "lucide-react";
import { getCsrfToken } from "@/utils/auth";
import logger from "@/utils/logger";

// Create form schema with validation rules
const signupFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters",
  }).trim(),
  email: z.string().email({
    message: "Please enter a valid email address",
  }).trim().toLowerCase(),
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
  const { register: authRegister, isLoading, error, errors, clearError, user } = useAuth();
  const navigate = useNavigate();
  const isSubmittingRef = useRef(false);
  const { toast } = useToast();
  const [showFormErrors, setShowFormErrors] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Set up the form with React Hook Form
  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onBlur", // Validate fields when they lose focus
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

  const onSubmit = async (values: SignupFormValues, event?: React.BaseSyntheticEvent) => {
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

    // Show validation errors if any
    setShowFormErrors(true);

    try {
      // Set submission flag
      isSubmittingRef.current = true;

      console.log("Starting registration process...");

      // First clear any existing CSRF tokens
      document.cookie = "XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "laravel_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

      // Wait a moment before getting a fresh token
      await new Promise(resolve => setTimeout(resolve, 300));

      // Get CSRF token first with retry logic
      try {
        console.log("Fetching CSRF token...");
        await getCsrfToken();
      } catch (csrfError) {
        logger.warn("CSRF token fetch failed, retrying once...", csrfError);
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log("Retrying CSRF token fetch...");
        await getCsrfToken();
      }

      logger.info("Attempting to register user");
      console.log("Sending registration request...");
      const success = await authRegister(values.name, values.email, values.password);

      if (success) {
        logger.info("Registration successful");

        // Reset form after successful registration
        form.reset();
        setShowFormErrors(false);

        // Log the success state for debugging
        console.log("Registration successful, authenticated status:", !!user);

        toast({
          title: "Account created!",
          description: "You've been successfully registered and logged in",
          variant: "default",
          className: "bg-green-500 text-white",
        });

        // Use React Router's navigate function instead of window.location
        // This avoids a full page reload and maintains the React app state
        setTimeout(() => {
          console.log("Redirecting to dashboard after successful registration");
          navigate('/dashboard', { replace: true });
        }, 2000);

      } else if (error) {
        // Backend errors already set in auth context
        toast({
          title: "Registration failed",
          description: error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Registration failed",
          description: "Please check the form and try again",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      logger.error("Registration error:", err);
      const errorMessage = err?.message || "An unexpected error occurred during registration";

      toast({
        title: "Registration error",
        description: errorMessage,
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
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
          <div className="mb-8">
            <h2 className="text-center text-2xl md:text-3xl font-bold text-gray-900">
              Create your account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Let's get started with your new account
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 border border-red-200 bg-red-50 text-red-700 rounded-lg text-sm">
              <p className="font-medium mb-1">Registration Error</p>
              <p>{error}</p>
              {errors && Object.keys(errors).length > 0 && (
                <ul className="mt-2 list-disc list-inside">
                  {Object.entries(errors).map(([field, messages]) => (
                    <li key={field} className="text-sm">
                      <span className="font-semibold capitalize">{field}:</span> {messages[0]}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <Form {...form}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                form.handleSubmit(onSubmit)(e);
              }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Full Name
                        </FormLabel>
                      </div>
                      <div className="relative mt-1">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                          <User size={16} />
                        </div>
                        <FormControl>
                          <Input
                            placeholder="Enter your name"
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
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Email Address
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
                          <Lock size={16} />
                        </div>
                        <FormControl>
                          <Input
                            placeholder="Create a secure password"
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

                {/* Password strength indicator */}
                {form.watch("password") && (
                  <div className="p-3 border border-gray-200 bg-gray-50 rounded-md">
                    <h4 className="text-xs font-medium text-gray-700 mb-2">Password Requirements:</h4>
                    <ul className="space-y-1">
                      <li className={`text-xs flex items-center ${form.watch("password").length >= 8 ? 'text-green-600' : 'text-gray-500'}`}>
                        <CheckCircle2 className={`h-3.5 w-3.5 mr-2 ${form.watch("password").length >= 8 ? 'text-green-600' : 'text-gray-400'}`} />
                        At least 8 characters
                      </li>
                      <li className={`text-xs flex items-center ${/[A-Z]/.test(form.watch("password")) ? 'text-green-600' : 'text-gray-500'}`}>
                        <CheckCircle2 className={`h-3.5 w-3.5 mr-2 ${/[A-Z]/.test(form.watch("password")) ? 'text-green-600' : 'text-gray-400'}`} />
                        At least 1 uppercase letter
                      </li>
                      <li className={`text-xs flex items-center ${/[a-z]/.test(form.watch("password")) ? 'text-green-600' : 'text-gray-500'}`}>
                        <CheckCircle2 className={`h-3.5 w-3.5 mr-2 ${/[a-z]/.test(form.watch("password")) ? 'text-green-600' : 'text-gray-400'}`} />
                        At least 1 lowercase letter
                      </li>
                      <li className={`text-xs flex items-center ${/[0-9]/.test(form.watch("password")) ? 'text-green-600' : 'text-gray-500'}`}>
                        <CheckCircle2 className={`h-3.5 w-3.5 mr-2 ${/[0-9]/.test(form.watch("password")) ? 'text-green-600' : 'text-gray-400'}`} />
                        At least 1 number
                      </li>
                    </ul>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Confirm Password
                        </FormLabel>
                      </div>
                      <div className="relative mt-1">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                          <Lock size={16} />
                        </div>
                        <FormControl>
                          <Input
                            placeholder="Confirm your password"
                            type={showConfirmPassword ? "text" : "password"}
                            className="pl-10 pr-10 h-11 rounded-md border-gray-300 focus:border-primary focus:ring-primary"
                            {...field}
                          />
                        </FormControl>
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                          aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                        >
                          {showConfirmPassword ? (
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

              <div className="mt-8">
                <button
                  type="submit"
                  disabled={isLoading || isSubmittingRef.current}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary hover:bg-primary-dark transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-sm"
                >
                  {isLoading || isSubmittingRef.current ? (
                    <span className="flex items-center justify-center">
                      <span className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                      Creating Account...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      Create Account
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </span>
                  )}
                </button>
              </div>

              <div className="mt-6 text-center text-sm">
                <span className="text-gray-600">Already have an account?</span>{" "}
                <Link to="/login" className="font-medium text-primary hover:text-primary-dark transition-colors">
                  Sign in
                </Link>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default SignupForm;
