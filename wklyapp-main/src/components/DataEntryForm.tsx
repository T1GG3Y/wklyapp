"use client";

import * as React from "react";
import { CalendarIcon, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FREQUENCY_OPTIONS, type Frequency } from "@/lib/constants";
import { formatAmountInput, parseFormattedAmount } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface DataEntryFormValues {
  name?: string;
  description?: string;
  amount: number;
  frequency: Frequency;
  dueDate?: Date;
  interestRate?: number;
}

interface DataEntryFormProps {
  mode: "add" | "edit";
  initialValues?: Partial<DataEntryFormValues>;
  onSave: (values: DataEntryFormValues) => void;
  onDelete?: () => void;
  onCancel: () => void;
  showFields?: {
    name?: boolean;
    description?: boolean;
    amount?: boolean;
    frequency?: boolean;
    dueDate?: boolean;
    interestRate?: boolean;
  };
  requireDescription?: boolean;
  isLoading?: boolean;
  className?: string;
}

export function DataEntryForm({
  mode,
  initialValues,
  onSave,
  onDelete,
  onCancel,
  showFields = {
    name: true,
    description: true,
    amount: true,
    frequency: true,
    dueDate: true,
  },
  requireDescription = false,
  isLoading = false,
  className,
}: DataEntryFormProps) {
  const [name, setName] = React.useState(initialValues?.name || "");
  const [description, setDescription] = React.useState(
    initialValues?.description || ""
  );
  const [amountInput, setAmountInput] = React.useState(
    initialValues?.amount ? formatAmountInput(initialValues.amount.toString()) : ""
  );
  const [frequency, setFrequency] = React.useState<Frequency>(
    initialValues?.frequency || "Monthly"
  );
  const [dueDate, setDueDate] = React.useState<Date | undefined>(
    initialValues?.dueDate
  );
  const [interestRate, setInterestRate] = React.useState(
    initialValues?.interestRate?.toString() || ""
  );

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatAmountInput(e.target.value);
    setAmountInput(formatted);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const values: DataEntryFormValues = {
      amount: parseFormattedAmount(amountInput),
      frequency,
    };

    if (showFields.name && name) {
      values.name = name;
    }
    if (showFields.description) {
      values.description = description;
    }
    if (showFields.dueDate && dueDate) {
      values.dueDate = dueDate;
    }
    if (showFields.interestRate && interestRate) {
      values.interestRate = parseFloat(interestRate);
    }

    onSave(values);
  };

  const isValid =
    parseFormattedAmount(amountInput) > 0 &&
    (!requireDescription || description.trim().length > 0);

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-4", className)}>
      {showFields.name && (
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter name"
          />
        </div>
      )}

      {showFields.description && (
        <div className="space-y-2">
          <Label htmlFor="description">
            Description
            {requireDescription && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter description"
            required={requireDescription}
          />
        </div>
      )}

      {showFields.amount && (
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
              $
            </span>
            <Input
              id="amount"
              value={amountInput}
              onChange={handleAmountChange}
              placeholder="0.00"
              className="pl-8"
              inputMode="decimal"
            />
          </div>
        </div>
      )}

      {showFields.frequency && (
        <div className="space-y-2">
          <Label htmlFor="frequency">Frequency</Label>
          <Select value={frequency} onValueChange={(v) => setFrequency(v as Frequency)}>
            <SelectTrigger id="frequency">
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              {FREQUENCY_OPTIONS.map((freq) => (
                <SelectItem key={freq} value={freq}>
                  {freq}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {showFields.dueDate && (
        <div className="space-y-2">
          <Label>Due Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dueDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dueDate ? format(dueDate, "PPP") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dueDate}
                onSelect={setDueDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      )}

      {showFields.interestRate && (
        <div className="space-y-2">
          <Label htmlFor="interestRate">Interest Rate (%)</Label>
          <div className="relative">
            <Input
              id="interestRate"
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
              placeholder="0.00"
              inputMode="decimal"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
              %
            </span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col gap-2 pt-4">
        <Button type="submit" disabled={!isValid || isLoading}>
          {mode === "add" ? "Add" : "Update Item"}
        </Button>

        <div className="flex gap-2">
          {mode === "edit" && onDelete && (
            <Button
              type="button"
              variant="destructive"
              onClick={onDelete}
              disabled={isLoading}
              className="flex-1"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}
