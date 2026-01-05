"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { BidWithBidder } from "@/types"
import { DollarSign, Clock, Mail, User, MessageSquare, CheckCircle, XCircle, Loader2 } from "lucide-react"
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

interface BidsPanelProps {
  locationId: string
  locationName: string
  onClose?: () => void
}

export function BidsPanel({ locationId, locationName, onClose }: BidsPanelProps) {
  const [bids, setBids] = useState<BidWithBidder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedBid, setSelectedBid] = useState<BidWithBidder | null>(null)
  const [actionType, setActionType] = useState<"accept" | "reject" | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const { toast } = useToast()

  const loadBids = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/bids/location/${locationId}`)
      
      if (!response.ok) {
        throw new Error("Failed to load bids")
      }

      const data = await response.json()
      setBids(data)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load bids.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadBids()
  }, [locationId])

  const handleUpdateBidStatus = async (bidId: string, status: "accepted" | "rejected") => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/bids/${bidId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update bid")
      }

      toast({
        title: `Bid ${status}`,
        description: `The bid has been ${status}.`,
      })

      // Reload bids
      await loadBids()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update bid.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
      setSelectedBid(null)
      setActionType(null)
    }
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

  const BidCard = ({ bid }: { bid: BidWithBidder }) => {
    const expired = isExpired(bid.expires_at)
    const showFullInfo = expired || bid.status !== 'pending'

    return (
      <Card className="mb-3">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white font-bold">
                {showFullInfo ? bid.bidder.name.charAt(0).toUpperCase() : "?"}
              </div>
              <div>
                <p className="font-medium">
                  {showFullInfo ? bid.bidder.name : "Anonymous Bidder"}
                </p>
                {showFullInfo && bid.bidder.email && (
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {bid.bidder.email}
                  </p>
                )}
              </div>
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
            <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <p className="text-sm flex items-start gap-2">
                <MessageSquare className="h-4 w-4 mt-0.5 text-gray-500" />
                <span>{bid.message}</span>
              </p>
            </div>
          )}

          <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {expired ? "Bidding ended" : getTimeRemaining(bid.expires_at)}
            </span>
            <span>
              Placed {new Date(bid.created_at).toLocaleDateString()} at{" "}
              {new Date(bid.created_at).toLocaleTimeString()}
            </span>
          </div>

          {bid.status === "pending" && expired && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="default"
                className="flex-1"
                onClick={() => {
                  setSelectedBid(bid)
                  setActionType("accept")
                }}
                disabled={isUpdating}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="flex-1"
                onClick={() => {
                  setSelectedBid(bid)
                  setActionType("reject")
                }}
                disabled={isUpdating}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </div>
          )}

          {!expired && bid.status === "pending" && (
            <div className="p-2 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded text-xs text-amber-800 dark:text-amber-200">
              Bidder details will be revealed when the bidding period ends
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
            Bids for {locationName}
          </CardTitle>
          <CardDescription>
            Manage bids received for this location. Bidder details are revealed after 24 hours.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
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

            <TabsContent value="pending" className="mt-4">
              {pendingBids.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No pending bids</p>
              ) : (
                pendingBids.map(bid => <BidCard key={bid.id} bid={bid} />)
              )}
            </TabsContent>

            <TabsContent value="accepted" className="mt-4">
              {acceptedBids.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No accepted bids</p>
              ) : (
                acceptedBids.map(bid => <BidCard key={bid.id} bid={bid} />)
              )}
            </TabsContent>

            <TabsContent value="rejected" className="mt-4">
              {rejectedBids.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No rejected bids</p>
              ) : (
                rejectedBids.map(bid => <BidCard key={bid.id} bid={bid} />)
              )}
            </TabsContent>

            <TabsContent value="expired" className="mt-4">
              {expiredBids.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No expired bids</p>
              ) : (
                expiredBids.map(bid => <BidCard key={bid.id} bid={bid} />)
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!selectedBid && !!actionType} onOpenChange={(open) => {
        if (!open) {
          setSelectedBid(null)
          setActionType(null)
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "accept" ? "Accept Bid?" : "Reject Bid?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "accept" 
                ? `Are you sure you want to accept this bid of $${selectedBid?.amount.toFixed(2)} from ${selectedBid?.bidder.name}? This action cannot be undone.`
                : `Are you sure you want to reject this bid of $${selectedBid?.amount.toFixed(2)} from ${selectedBid?.bidder.name}?`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedBid && actionType) {
                  handleUpdateBidStatus(selectedBid.id, actionType)
                }
              }}
              disabled={isUpdating}
              className={actionType === "reject" ? "bg-red-600 hover:bg-red-700" : ""}
            >
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {actionType === "accept" ? "Accept" : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
