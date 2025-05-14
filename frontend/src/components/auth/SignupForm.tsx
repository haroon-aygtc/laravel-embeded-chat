import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MessageSquare, Lock, Mail, User } from "lucide-react";
import { Link } from "react-router-dom";
import { getCsrfToken } from "@/utils/auth";
import logger from "@/utils/logger";

const SignupForm = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const { register, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const isSubmittingRef = useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent multiple submissions
    if (isSubmittingRef.current || isLoading) {
      logger.warn("Preventing duplicate form submission");
      return;
    }

    // Clear any previous errors
    clearError();
    setFormError(null);

    // Validate password confirmation
    if (password !== confirmPassword) {
      setFormError("Passwords do not match");
      return;
    }

    try {
      // Set submission flag
      isSubmittingRef.current = true;

      // Get CSRF token before submission
      await getCsrfToken();

      logger.info("Attempting to register user");
      const success = await register(name, email, password);

      if (success) {
        logger.info("Registration successful, navigating to home");
        navigate("/");
      } else {
        setFormError("Registration failed. Please try again.");
      }
    } catch (err) {
      logger.error("Registration error:", err);
      setFormError("An error occurred during registration. Please try again.");
    } finally {
      // Reset submission flag with delay to prevent repeated submissions
      setTimeout(() => {
        isSubmittingRef.current = false;
      }, 2000);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Create an Account
          </CardTitle>
          <CardDescription className="text-center">
            Sign up to access the chat system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(error || formError) && (
            <Card className="border-red-300 bg-red-50 mt-4">
              <CardContent className="p-4">
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    {formError || (typeof error === 'object' ? JSON.stringify(error) : error)}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => {
                    clearError();
                    setFormError(null);
                    setName(e.target.value);
                  }}
                  required
                  className="pl-10"
                />
                <div className="absolute left-3 top-3 text-gray-400">
                  <User size={16} />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    clearError();
                    setFormError(null);
                    setEmail(e.target.value);
                  }}
                  required
                  className="pl-10"
                />
                <div className="absolute left-3 top-3 text-gray-400">
                  <Mail size={16} />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    clearError();
                    setFormError(null);
                    setPassword(e.target.value);
                  }}
                  required
                  className="pl-10"
                />
                <div className="absolute left-3 top-3 text-gray-400">
                  <Lock size={16} />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => {
                    clearError();
                    setFormError(null);
                    setConfirmPassword(e.target.value);
                  }}
                  required
                  className="pl-10"
                />
                <div className="absolute left-3 top-3 text-gray-400">
                  <Lock size={16} />
                </div>
              </div>
              {password !== confirmPassword && confirmPassword && (
                <p className="text-sm text-red-500">Passwords do not match</p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || isSubmittingRef.current}
            >
              {isLoading || isSubmittingRef.current ? "Creating account..." : "Sign Up"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-500">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Log in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SignupForm;
