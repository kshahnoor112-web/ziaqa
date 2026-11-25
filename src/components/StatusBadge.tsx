import React, { useState } from 'react';
import {
  CheckCircle2,
  ChefHat,
  Clock,
  PackageCheck,
  Sparkles,
  Truck,
  UserCheck,
  UtensilsCrossed,
  XCircle,
} from 'lucide-react';
import { OrderStatus } from '../types/zaiqa';

const STATUS_STYLE_MAP: Record<
  OrderStatus,
  { bg: string; text: string; border: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  'New Order': {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    Icon: Sparkles,
  },
  Confirmed: {
    bg: 'bg-sky-50',
    text: 'text-sky-800',
    border: 'border-sky-200',
    Icon: Clock,
  },
  Preparing: {
    bg: 'bg-orange-50',
    text: 'text-orange-800',
    border: 'border-orange-200',
    Icon: ChefHat,
  },
  'Ready for Pickup': {
    bg: 'bg-indigo-50',
    text: 'text-indigo-800',
    border: 'border-indigo-200',
    Icon: PackageCheck,
  },
  'Assigned to Rider': {
    bg: 'bg-violet-50',
    text: 'text-violet-800',
    border: 'border-violet-200',
    Icon: UserCheck,
  },
  'Out for Delivery': {
    bg: 'bg-amber-100',
    text: 'text-amber-900',
    border: 'border-amber-300',
    Icon: Truck,
  },
  Delivered: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    Icon: CheckCircle2,
  },
  Cancelled: {
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    border: 'border-rose-200',
    Icon: XCircle,
  },
};

export const StatusBadge: React.FC<{ status: OrderStatus; compact?: boolean }> = ({
  status,
  compact = false,
}) => {
  const style = STATUS_STYLE_MAP[status];
  const Icon = style.Icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border font-medium whitespace-nowrap shrink-0 ${style.bg} ${style.text} ${style.border} ${
        compact ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      }`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>{status}</span>
    </span>
  );
};

interface FoodImageProps {
  src: string;
  alt: string;
  titleFallback: string;
  className?: string;
}

export const FoodImage: React.FC<FoodImageProps> = ({
  src,
  alt,
  titleFallback,
  className = 'w-full h-full object-cover',
}) => {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className="w-full h-full bg-gradient-to-br from-[#292524] via-[#1C1917] to-[#44403C] flex flex-col items-center justify-center p-4 text-center text-stone-200"
        role="img"
        aria-label={alt}
      >
        <UtensilsCrossed className="w-8 h-8 text-amber-400 mb-2" aria-hidden="true" />
        <span className="text-xs font-medium tracking-wide text-stone-300 line-clamp-2">
          {titleFallback}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
};
