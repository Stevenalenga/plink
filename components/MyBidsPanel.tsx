"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { BidWithLocation } from "@/types"
import { DollarSign, Clock, MapPin, Edit2, Trash2, Loader2, MessageSquare } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export function MyBidsPanel() {
  const [bids, setBids] = useState<BidWithLocation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedBid, setSelectedBid] = useState<BidWithLocation | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editAmount, setEditAmount] = useState("")
  const [editMessage, setEditMessage] = useState("")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const { toast } = useToast()

  const loadBids = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/bids/my-bids")
      
      if (!response.ok) {
        throw new Error("Failed to load bids")
      }

      const data = await response.json()
      setBids(data)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load your bids.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadBids()
  }, [])

  const handleDeleteBid = async () => {
    if (!selectedBid) return
    
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/bids/${selectedBid.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete bid")
      }

      toast({
        title: "Bid deleted",
        description: "Your bid has been successfully deleted.",
      })

      await loadBids()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete bid.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
      setSelectedBid(null)
    }
  }

  const handleEditBid = async () => {
    if (!selectedBid) return

    const amountNum = parseFloat(editAmount)
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid positive number.",
        variant: "destructive",
      })
      return
    }

    if (editMessage.length > 500) {
      toast({
        title: "Message too long",
        description: "Message cannot exceed 500 characters.",
        variant: "destructive",
      })
      return
    }

    setIsEditing(true)
    try {
      const response = await fetch(`/api/bids/${selectedBid.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amountNum,
          message: editMessage.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update bid")
      }

      toast({
        title: "Bid updated",
        description: "Your bid has been successfully updated.",
      })

      await loadBids()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update bid.",
        variant: "destructive",
      })
    } finally {
      setIsEditing(false)
      setShowEditDialog(false)
      setSelectedBid(null)
    }
  }

  const openEditDialog = (bid: BidWithLocation) => {
    setSelectedBid(bid)
    setEditAmount(bid.amount.toString())
    setEditMessage(bid.message || "")
    setShowEditDialog(true)
  }

  const openDeleteDialog = (bid: BidWithLocation) => {
    setSelectedBid(bid)
    setShowDeleteDialog(true)
  }

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date()
    const expiry = new Date(expiresAt)
    const diff = expiry.getTime() - now.getTime()

    if (diff <= 0) {
      return "Expired"
    }

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`
    }
    return `${minutes}m remaining`
  }

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date()
  }

  const pendingBids = bids.filter(b => b.status === 'pending')
  const acceptedBids = bids.filter(b => b.status === 'accepted')
  const rejectedBids = bids.filter(b => b.status === 'rejected')
  const expiredBids = bids.filter(b => b.status === 'expired')

  const BidCard = ({ bid }: { bid: BidWithLocation }) => {
    const expired = isExpired(bid.expires_at)
    const canEdit = bid.status === 'pending' && !expired

    return (
      <Card className="mb-4">
        <CardContent className="pt-6 px-6 pb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                {bid.location.name}
              </h3>
              <p className="text-sm text-gray-500">
                Owner: {bid.location.users?.name || "Unknown"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600">
                ${bid.amount.toFixed(2)}
              </p>
              <Badge
                variant={
                  bid.status === "accepted"
                    ? "default"
                    : bid.status === "rejected"
                    ? "destructive"
                    : bid.status === "expired"
                    ? "secondary"
                    : "outline"
                }
              >
                {bid.status}
              </Badge>
            </div>
          </div>

          {bid.message && (
            <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <p className="text-sm flex items-start gap-2">
                <MessageSquare className="h-4 w-4 mt-0.5 text-gray-500" />
                <span>{bid.message}</span>
              </p>
            </div>
          )}

          <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {expired ? "Bidding ended" : getTimeRemaining(bid.expires_at)}
            </span>
            <span>
              Placed {new Date(bid.created_at).toLocaleDateString()}
            </span>
          </div>

          {canEdit && (
            <div className="flex gap-3 mt-4">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => openEditDialog(bid)}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => openDeleteDialog(bid)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          )}

          {bid.status === "accepted" && (
            <div className="p-4 mt-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                🎉 Your bid was accepted! The location owner may contact you soon.
              </p>
            </div>
          )}

          {bid.status === "rejected" && (
            <div className="p-4 mt-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">
                Your bid was not accepted this time.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            My Bids
          </CardTitle>
          <CardDescription>
            View and manage all your submitted bids
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-4 gap-2">
              <TabsTrigger value="pending">
                Pending ({pendingBids.length})
              </TabsTrigger>
              <TabsTrigger value="accepted">
                Accepted ({acceptedBids.length})
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Rejected ({rejectedBids.length})
              </TabsTrigger>
              <TabsTrigger value="expired">
                Expired ({expiredBids.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-6">
              {pendingBids.length === 0 ? (
                <p className="text-center text-gray-500 py-12">No pending bids</p>
              ) : (
                pendingBids.map(bid => <BidCard key={bid.id} bid={bid} />)
              )}
            </TabsContent>

            <TabsContent value="accepted" className="mt-6">
              {acceptedBids.length === 0 ? (
                <p className="text-center text-gray-500 py-12">No accepted bids</p>
              ) : (
                acceptedBids.map(bid => <BidCard key={bid.id} bid={bid} />)
              )}
            </TabsContent>

            <TabsContent value="rejected" className="mt-6">
              {rejectedBids.length === 0 ? (
                <p className="text-center text-gray-500 py-12">No rejected bids</p>
              ) : (
                rejectedBids.map(bid => <BidCard key={bid.id} bid={bid} />)
              )}
            </TabsContent>

            <TabsContent value="expired" className="mt-6">
              {expiredBids.length === 0 ? (
                <p className="text-center text-gray-500 py-12">No expired bids</p>
              ) : (
                expiredBids.map(bid => <BidCard key={bid.id} bid={bid} />)
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Bid</DialogTitle>
            <DialogDescription>
              Update your bid for {selectedBid?.location.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-amount">
                Bid Amount ($) <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input
                  id="edit-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="pl-9"
                  disabled={isEditing}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-message">Message (Optional)</Label>
              <Textarea
                id="edit-message"
                value={editMessage}
                onChange={(e) => setEditMessage(e.target.value)}
                maxLength={500}
                rows={4}
                disabled={isEditing}
              />
              <p className="text-xs text-gray-500 text-right">
                {editMessage.length}/500 characters
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={isEditing}
            >
              Cancel
            </Button>
            <Button onClick={handleEditBid} disabled={isEditing}>
              {isEditing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bid?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete your bid of ${selectedBid?.amount.toFixed(2)} for{" "}
              {selectedBid?.location.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBid}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
