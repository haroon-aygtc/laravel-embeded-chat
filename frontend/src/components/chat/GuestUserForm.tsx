import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Phone, Mail } from "lucide-react";

// Define form schema with validation
const guestFormSchema = z.object({
  fullName: z
    .string()
    .min(2, { message: "Full name must be at least 2 characters" })
    .max(100, { message: "Full name must be less than 100 characters" }),
  phoneNumber: z
    .string()
    .min(5, { message: "Phone number must be at least 5 characters" })
    .max(20, { message: "Phone number must be less than 20 characters" })
    .regex(/^[+]?[0-9\s-()]+$/, {
      message: "Please enter a valid phone number",
    }),
  email: z
    .string()
    .email({ message: "Please enter a valid email address" })
    .optional()
    .or(z.literal("")),
});

type GuestFormValues = z.infer<typeof guestFormSchema>;

interface GuestUserFormProps {
  onSubmit: (data: GuestFormValues) => void;
  isLoading?: boolean;
}

const GuestUserForm: React.FC<GuestUserFormProps> = ({
  onSubmit,
  isLoading = false,
}) => {
  const form = useForm<GuestFormValues>({
    resolver: zodResolver(guestFormSchema),
    defaultValues: {
      fullName: "",
      phoneNumber: "",
      email: "",
    },
  });

  const handleSubmit = (data: GuestFormValues) => {
    onSubmit(data);
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-white shadow-md rounded-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold text-center">
          Welcome to Chat
        </CardTitle>
        <p className="text-sm text-center text-muted-foreground">
          Please provide your information to continue
        </p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name *</FormLabel>
                  <FormControl>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <Input placeholder="John Doe" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number *</FormLabel>
                  <FormControl>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <Input placeholder="+1 (555) 123-4567" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (Optional)</FormLabel>
                  <FormControl>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <Input placeholder="john.doe@example.com" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full mt-6" disabled={isLoading}>
              {isLoading ? "Processing..." : "Start Chatting"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default GuestUserForm;
