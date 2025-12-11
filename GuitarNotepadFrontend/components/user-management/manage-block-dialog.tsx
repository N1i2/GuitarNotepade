"use client";

import { User } from "@/types/profile";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Calendar, Clock, Loader2, ShieldAlert, UserCheck } from "lucide-react";
import { useState, useEffect } from "react";

interface ManageBlockDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onBlock: (reason: string, blockedUntil: Date) => Promise<void>;
  onUnblock: () => Promise<void>;
  user: User;
  isLoading: boolean;
}

export function ManageBlockDialog({
  isOpen,
  onClose,
  onBlock,
  onUnblock,
  user,
  isLoading,
}: ManageBlockDialogProps) {
  const [reason, setReason] = useState(user.blockReason || "");
  const [duration, setDuration] = useState("1");
  const [durationUnit, setDurationUnit] = useState<"minutes" | "hours" | "days" | "months" | "years">("days");
  const [errors, setErrors] = useState<{ reason?: string; duration?: string }>({});
  const [mode, setMode] = useState<"block" | "unblock">(user.isBlocked ? "unblock" : "block");

  useEffect(() => {
    if (user.isBlocked && user.blockedUntil) {
      const blockedUntil = new Date(user.blockedUntil);
      const now = new Date();
      const diffMs = blockedUntil.getTime() - now.getTime();
      const diffMinutes = Math.max(1, Math.ceil(diffMs / 60000));
      
      if (diffMinutes < 60) {
        setDuration(diffMinutes.toString());
        setDurationUnit("minutes");
      } else if (diffMinutes < 24 * 60) {
        setDuration(Math.ceil(diffMinutes / 60).toString());
        setDurationUnit("hours");
      } else if (diffMinutes < 30 * 24 * 60) {
        setDuration(Math.ceil(diffMinutes / (24 * 60)).toString());
        setDurationUnit("days");
      } else if (diffMinutes < 365 * 24 * 60) {
        setDuration(Math.ceil(diffMinutes / (30 * 24 * 60)).toString());
        setDurationUnit("months");
      } else {
        setDuration(Math.ceil(diffMinutes / (365 * 24 * 60)).toString());
        setDurationUnit("years");
      }
      
      setReason(user.blockReason || "");
    } else {
      setReason("");
      setDuration("1");
      setDurationUnit("days");
    }
  }, [user]);

  const validateForm = () => {
    const newErrors: { reason?: string; duration?: string } = {};

    if (mode === "block") {
      if (!reason.trim()) {
        newErrors.reason = "Reason is required";
      }

      const durationNum = parseInt(duration);
      if (isNaN(durationNum) || durationNum <= 0) {
        newErrors.duration = "Duration must be a positive number";
      } else {
        const minutes = getMinutesFromDuration(durationNum, durationUnit);
        if (minutes < 1) {
          newErrors.duration = "Minimum block duration is 1 minute";
        } else if (minutes > 100 * 365 * 24 * 60) {
          newErrors.duration = "Maximum block duration is 100 years";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getMinutesFromDuration = (value: number, unit: string): number => {
    switch (unit) {
      case "minutes": return value;
      case "hours": return value * 60;
      case "days": return value * 24 * 60;
      case "months": return value * 30 * 24 * 60;
      case "years": return value * 365 * 24 * 60;
      default: return value;
    }
  };

  const handleSubmit = async () => {
    if (mode === "unblock") {
      await onUnblock();
      return;
    }

    if (!validateForm()) return;

    const durationNum = parseInt(duration);
    const minutes = getMinutesFromDuration(durationNum, durationUnit);
    const blockedUntil = new Date(Date.now() + minutes * 60000);

    await onBlock(reason, blockedUntil);
  };

  const calculateBlockedUntil = () => {
    const durationNum = parseInt(duration);
    if (isNaN(durationNum) || durationNum <= 0) return "Invalid duration";

    const minutes = getMinutesFromDuration(durationNum, durationUnit);
    const blockedUntil = new Date(Date.now() + minutes * 60000);
    
    return blockedUntil.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  const formatRemainingTime = () => {
    if (!user.blockedUntil) return "";
    
    const blockedUntil = new Date(user.blockedUntil);
    const now = new Date();
    const diffMs = blockedUntil.getTime() - now.getTime();
    
    if (diffMs <= 0) return "Block has expired";
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    
    return parts.join(' ');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${user.isBlocked ? 'bg-amber-100 dark:bg-amber-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
              {user.isBlocked ? (
                <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              ) : (
                <ShieldAlert className="h-6 w-6 text-red-600 dark:text-red-400" />
              )}
            </div>
            <div>
              <DialogTitle className="text-lg">
                {user.isBlocked ? 'Manage Block' : 'Block User'}
              </DialogTitle>
              <DialogDescription>
                {user.isBlocked 
                  ? `Manage block for ${user.email}`
                  : `Block ${user.email} from accessing their account`
                }
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="p-3 bg-muted rounded-md">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium">{user.nikName}</div>
                <div className="text-sm text-muted-foreground">{user.email}</div>
              </div>
              <div className={`px-2 py-1 rounded text-xs ${user.isBlocked ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'}`}>
                {user.isBlocked ? 'BLOCKED' : 'ACTIVE'}
              </div>
            </div>
            
            {user.isBlocked && user.blockedUntil && (
              <div className="mt-2 space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  <span>Blocked until: </span>
                  <span className="font-medium">
                    {new Date(user.blockedUntil).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  <span>Time remaining: </span>
                  <span className="font-medium">
                    {formatRemainingTime()}
                  </span>
                </div>
                {user.blockReason && (
                  <div>
                    <span className="font-medium">Reason: </span>
                    <span className="text-muted-foreground">{user.blockReason}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex border rounded-md overflow-hidden">
            <button
              type="button"
              onClick={() => setMode("block")}
              className={`flex-1 py-2 text-center text-sm font-medium transition-colors ${
                mode === "block" 
                  ? 'bg-destructive text-destructive-foreground' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <ShieldAlert className="h-4 w-4" />
                Block User
              </div>
            </button>
            {user.isBlocked && (
              <button
                type="button"
                onClick={() => setMode("unblock")}
                className={`flex-1 py-2 text-center text-sm font-medium transition-colors ${
                  mode === "unblock" 
                    ? 'bg-green-600 text-white' 
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Unblock Now
                </div>
              </button>
            )}
          </div>

          {mode === "block" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="reason" className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Block Reason *
                </Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    if (errors.reason) setErrors({...errors, reason: undefined});
                  }}
                  placeholder="Enter the reason for blocking this user..."
                  className="min-h-[100px]"
                />
                {errors.reason && (
                  <p className="text-sm text-red-500">{errors.reason}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  This reason will be shown to the user when they try to login
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Block Duration *
                </Label>
                
                <div className="flex gap-2">
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    value={duration}
                    onChange={(e) => {
                      setDuration(e.target.value);
                      if (errors.duration) setErrors({...errors, duration: undefined});
                    }}
                    className="flex-1"
                    placeholder="Enter duration"
                  />
                  <select
                    value={durationUnit}
                    onChange={(e) => setDurationUnit(e.target.value as any)}
                    className="px-3 py-2 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                    <option value="months">Months</option>
                    <option value="years">Years</option>
                  </select>
                </div>
                
                {errors.duration && (
                  <p className="text-sm text-red-500">{errors.duration}</p>
                )}

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Block will be lifted on: </span>
                  <span className="font-medium text-foreground">
                    {calculateBlockedUntil()}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground">
                  Minimum: 1 minute, Maximum: 100 years
                </p>
              </div>
            </>
          )}

          {mode === "unblock" && (
            <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
              <UserCheck className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium text-green-800 dark:text-green-300">
                    Unblock {user.nikName}?
                  </p>
                  <p className="text-sm">
                    This will immediately restore access to their account.
                    {user.blockedUntil && (
                      <span className="block mt-1">
                        Original block was until: {new Date(user.blockedUntil).toLocaleString()}
                      </span>
                    )}
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-3 sm:gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant={mode === "unblock" ? "default" : "destructive"}
            onClick={handleSubmit}
            disabled={isLoading}
            className={`w-full sm:w-auto ${mode === "unblock" ? 'bg-green-600 hover:bg-green-700' : ''}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : mode === "unblock" ? (
              <>
                <UserCheck className="mr-2 h-4 w-4" />
                Unblock User
              </>
            ) : (
              <>
                <ShieldAlert className="mr-2 h-4 w-4" />
                Block User
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}