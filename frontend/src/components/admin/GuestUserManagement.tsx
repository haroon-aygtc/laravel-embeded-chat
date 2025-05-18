import React, { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pagination } from "@/components/ui/pagination";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MoreHorizontal,
  Search,
  UserCheck,
  UserX,
  RefreshCw,
  Activity,
  Phone,
  Mail,
  Calendar,
  Clock,
  AlertCircle,
} from "lucide-react";
import guestUserService, {
  GuestUser,
  GuestActivity,
} from "@/services/guestUserService";
import { format } from "date-fns";

const GuestUserManagement: React.FC = () => {
  const [users, setUsers] = useState<GuestUser[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<GuestUser | null>(null);
  const [userActivities, setUserActivities] = useState<GuestActivity[]>([]);
  const [isActivitiesLoading, setIsActivitiesLoading] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const { toast } = useToast();

  const pageSize = 10;

  // Load guest users
  useEffect(() => {
    loadUsers();
  }, [currentPage, searchTerm, statusFilter]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const filters: { status?: string; search?: string } = {};
      if (statusFilter) filters.status = statusFilter;
      if (searchTerm) filters.search = searchTerm;

      const response = await guestUserService.getAllGuestUsers(
        pageSize,
        (currentPage - 1) * pageSize,
        filters
      );

      if (response.success && response.data) {
        setUsers(response.data.users);
        setTotalUsers(response.data.totalCount);
      } else {
        throw new Error(response.error?.message || "Failed to load guest users");
      }
    } catch (error) {
      console.error("Error loading guest users:", error);
      toast({
        title: "Error",
        description: "Failed to load guest users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load user activities
  const loadUserActivities = async (userId: string) => {
    setIsActivitiesLoading(true);
    try {
      const response = await guestUserService.getGuestActivities(userId, 50);

      if (response.success && response.data) {
        setUserActivities(response.data.activities);
      } else {
        throw new Error(
          response.error?.message || "Failed to load user activities"
        );
      }
    } catch (error) {
      console.error("Error loading user activities:", error);
      toast({
        title: "Error",
        description: "Failed to load user activities. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsActivitiesLoading(false);
    }
  };

  // Update user status
  const updateUserStatus = async (
    userId: string,
    status: "active" | "inactive" | "blocked"
  ) => {
    try {
      const response = await guestUserService.updateGuestUserStatus(
        userId,
        status
      );

      if (response.success && response.data) {
        // Update the user in the list
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === userId ? { ...user, status } : user
          )
        );

        // Update selected user if open
        if (selectedUser && selectedUser.id === userId) {
          setSelectedUser({ ...selectedUser, status });
        }

        toast({
          title: "Success",
          description: `User status updated to ${status}`,
        });
      } else {
        throw new Error(
          response.error?.message || "Failed to update user status"
        );
      }
    } catch (error) {
      console.error("Error updating user status:", error);
      toast({
        title: "Error",
        description: "Failed to update user status. Please try again.",
        variant: "destructive",
      });
    }
  };

  // View user details
  const viewUserDetails = (user: GuestUser) => {
    setSelectedUser(user);
    loadUserActivities(user.id);
    setIsDetailsOpen(true);
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy h:mm a");
    } catch (error) {
      return dateString;
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Active
          </Badge>
        );
      case "inactive":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            Inactive
          </Badge>
        );
      case "blocked":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Blocked
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700">
            {status}
          </Badge>
        );
    }
  };

  // Calculate total pages
  const totalPages = Math.ceil(totalUsers / pageSize);


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Guest Users</CardTitle>
          <CardDescription>
            Manage guest users who have accessed the chat without authentication
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, phone, email..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(null)}
                >
                  All
                </Button>
                <Button
                  variant={statusFilter === "active" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("active")}
                >
                  Active
                </Button>
                <Button
                  variant={statusFilter === "blocked" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("blocked")}
                >
                  Blocked
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={loadUsers}
                  disabled={isLoading}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                  />
                </Button>
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead className="hidden md:table-cell">Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                        <p>Loading guest users...</p>
                      </TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <p className="text-muted-foreground">No guest users found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.fullName}
                        </TableCell>
                        <TableCell>{user.phoneNumber}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {user.email || "-"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {formatDate(user.createdAt)}
                        </TableCell>
                        <TableCell>{getStatusBadge(user.status)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                className="h-8 w-8 p-0"
                              >
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => viewUserDetails(user)}
                              >
                                View details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {user.status !== "active" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateUserStatus(user.id, "active")
                                  }
                                >
                                  <UserCheck className="mr-2 h-4 w-4" />
                                  Activate
                                </DropdownMenuItem>
                              )}
                              {user.status !== "blocked" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateUserStatus(user.id, "blocked")
                                  }
                                >
                                  <UserX className="mr-2 h-4 w-4" />
                                  Block
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center mt-4">
                <Pagination>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  >
                    First
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="mx-2 flex items-center text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    Last
                  </Button>
                </Pagination>
              </div>
            )}
          </div>
        </CardContent>
      </Card>


      {/* User Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Guest User Details</DialogTitle>
            <DialogDescription>
              View detailed information about this guest user
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <Tabs defaultValue="details">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">User Details</TabsTrigger>
                <TabsTrigger value="activities">Activity Log</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Full Name</p>
                    <p className="text-sm">{selectedUser.fullName}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-medium">Status</p>
                    <div>{getStatusBadge(selectedUser.status)}</div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-medium flex items-center">
                      <Phone className="h-4 w-4 mr-1" /> Phone Number
                    </p>
                    <p className="text-sm">{selectedUser.phoneNumber}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-medium flex items-center">
                      <Mail className="h-4 w-4 mr-1" /> Email
                    </p>
                    <p className="text-sm">{selectedUser.email || "-"}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-medium flex items-center">
                      <Calendar className="h-4 w-4 mr-1" /> Created At
                    </p>
                    <p className="text-sm">{formatDate(selectedUser.createdAt)}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-medium flex items-center">
                      <Clock className="h-4 w-4 mr-1" /> Last Updated
                    </p>
                    <p className="text-sm">{formatDate(selectedUser.updatedAt)}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium">IP Address</p>
                  <p className="text-sm">{selectedUser.ipAddress || "-"}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium">User Agent</p>
                  <p className="text-sm break-words">
                    {selectedUser.userAgent || "-"}
                  </p>
                </div>

                <div className="flex justify-between mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setIsDetailsOpen(false)}
                  >
                    Close
                  </Button>
                  <div className="space-x-2">
                    {selectedUser.status !== "active" && (
                      <Button
                        onClick={() =>
                          updateUserStatus(selectedUser.id, "active")
                        }
                        variant="default"
                      >
                        Activate
                      </Button>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GuestUserManagement;


