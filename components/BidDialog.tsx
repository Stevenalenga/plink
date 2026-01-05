"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2, DollarSign, Clock, X } from "lucide-react"

interface BidDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  locationId: string
  locationName: string
  onBidCreated?: () => void
}

export function BidDialog({
  open,
  onOpenChange,
  locationId,
  locationName,
  onBidCreated,
}: BidDialogProps) {
  const [amount, setAmount] = useState("")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState("24:00:00")
  const { toast } = useToast()

  // Calculate time remaining (24 hours from now)
  useEffect(() => {
    if (!open) return

    const endTime = new Date()
    endTime.setHours(endTime.getHours() + 24)

    const updateTimer = () => {
      const now = new Date()
      const diff = endTime.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeRemaining("00:00:00")
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeRemaining(
        `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      )
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid positive number.",
        variant: "destructive",
      })
      return
    }

    if (message.length > 500) {
      toast({
        title: "Message too long",
        description: "Message cannot exceed 500 characters.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/bids", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          location_id: locationId,
          amount: amountNum,
          message: message.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create bid")
      }

      toast({
        title: "Bid submitted!",
        description: `Your bid of $${amountNum.toFixed(2)} has been placed on "${locationName}".`,
      })

      // Reset form
      setAmount("")
      setMessage("")
      onOpenChange(false)
      onBidCreated?.()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit bid. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setAmount("")
    setMessage("")
    onOpenChange(false)
  }

  return (
    <Dialog 
      open={open} 
      modal={true}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          // Reset form when closing
          setAmount("")
          setMessage("")
        }
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent 
        className="sm:max-w-[500px] max-w-[90vw] max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => {
          // Prevent closing when clicking on the dialog itself
          if (isSubmitting) {
            e.preventDefault()
          }
        }}
        onEscapeKeyDown={(e) => {
          // Allow ESC to close unless submitting
          if (isSubmitting) {
            e.preventDefault()
          }
        }}
      >
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none z-50">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>
        
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Place a Bid
          </DialogTitle>
          <DialogDescription>
            Submit your bid for <strong>{locationName}</strong>. The location owner will see your bid after 24 hours.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Time Remaining */}
            <div className="flex items-center justify-center gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                Bid expires in: {timeRemaining}
              </span>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="amount">
                Bid Amount ($) <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="Enter amount (e.g., 50.00)"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-9"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <p className="text-xs text-gray-500">
                Enter your bid amount in USD. Higher bids may be more attractive to the owner.
              </p>
            </div>

            {/* Optional Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Add a message to the location owner (max 500 characters)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={500}
                rows={4}
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500 text-right">
                {message.length}/500 characters
              </p>
            </div>

            {/* Info Banner */}
            <div className="p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-xs text-amber-800 dark:text-amber-200">
                <strong>Note:</strong> Your identity will remain anonymous until the 24-hour bidding period ends. 
                The location owner can then see your details and contact you if interested.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Bid
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
