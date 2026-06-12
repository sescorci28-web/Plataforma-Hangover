'use client';

import React, { useState, useTransition } from "react";
import { Star, MessageSquare, ShieldCheck, Calendar, ArrowRight, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { createServiceReview } from "@/app/services/actions";

interface ReviewUser {
  full_name: string | null;
  avatar_url: string | null;
}

interface ReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user: ReviewUser | null;
}

interface ServiceReviewsSectionProps {
  serviceId: string;
  reviews: ReviewItem[];
  user: any;
  eligibleBookingId: string | null; // ID of booking that is confirmed/completed and not yet reviewed
}

export function ServiceReviewsSection({
  serviceId,
  reviews = [],
  user,
  eligibleBookingId
}: ServiceReviewsSectionProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!eligibleBookingId) {
      setError("No tienes reservas válidas confirmadas para este servicio que puedas calificar.");
      return;
    }

    startTransition(async () => {
      const result = await createServiceReview(
        eligibleBookingId,
        serviceId,
        rating,
        comment
      );

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setComment("");
        // Refresh page after a brief delay
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    });
  };

  // Calculate rating summary
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
    : "5.0";

  // Calculate distribution
  const distribution = [0, 0, 0, 0, 0]; // index 0 is 5 stars, index 4 is 1 star
  reviews.forEach((r) => {
    const starIdx = 5 - r.rating;
    if (starIdx >= 0 && starIdx < 5) {
      distribution[starIdx]++;
    }
  });

  return (
    <div className="bg-zinc-950/40 border border-white/5 p-6 sm:p-8 rounded-3xl backdrop-blur-md space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-white font-outfit uppercase tracking-widest text-primary-400 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary-455" />
          Opiniones Verificadas ({totalReviews})
        </h2>
        <p className="text-zinc-400 text-xs mt-1">Solo los clientes que contrataron el show pueden calificar al proveedor.</p>
      </div>

      {/* Ratings Summary Block */}
      <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-6 items-center p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
        <div className="text-center md:border-r md:border-white/5 md:pr-6 space-y-1">
          <p className="text-5xl font-black text-white font-outfit">{averageRating}</p>
          <div className="flex justify-center text-amber-400">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${star <= Math.round(Number(averageRating)) ? "fill-amber-400" : "text-zinc-700"}`}
              />
            ))}
          </div>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Calificación Promedio</p>
        </div>

        {/* Distro chart */}
        <div className="space-y-2.5">
          {distribution.map((count, index) => {
            const starNum = 5 - index;
            const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
            return (
              <div key={starNum} className="flex items-center gap-3 text-xs">
                <span className="w-3 text-right text-zinc-450 font-bold">{starNum}</span>
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                <div className="flex-grow h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                  <div className="h-full bg-gradient-to-r from-primary-500 to-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-6 text-right text-zinc-500 font-bold">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leave Review Form (for eligible bookings) */}
      {eligibleBookingId && !success && (
        <form onSubmit={handleReviewSubmit} className="p-6 bg-primary-950/10 border border-primary-500/15 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 text-primary-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-primary-400" />
            <span>¡Tu reserva ha finalizado! Deja tu reseña verificada</span>
          </div>

          {error && (
            <div className="flex items-center gap-2.5 p-3.5 bg-red-500/10 border border-red-500/25 rounded-2xl text-red-400 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Stars Input */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-500">Puntuación</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  disabled={isPending}
                  className="text-zinc-500 hover:text-amber-400 transition-colors p-1 cursor-pointer focus:outline-none"
                >
                  <Star
                    className={`w-6 h-6 ${star <= rating ? "fill-amber-400 text-amber-400" : "text-zinc-700"}`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Comment Textarea */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-500">Tu Opinión</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Escribe aquí tu comentario sobre el servicio del proveedor. Sé detallado para ayudar a otros organizadores de eventos."
              required
              disabled={isPending}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-3.5 text-xs text-white placeholder:text-zinc-650 focus:outline-none focus:ring-1 focus:ring-primary-500/50 min-h-[80px] resize-none font-sans"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="bg-primary-600 hover:bg-primary-500 text-white rounded-xl py-3 px-6 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-lg shadow-primary-500/10"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Publicando...
              </>
            ) : (
              <>
                <span>Publicar Opinión</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center py-10 border border-white/5 bg-black/20 rounded-2xl">
            <p className="text-xs text-zinc-500">Este servicio aún no tiene reseñas. ¡Sé el primero en contratarlo!</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5 space-y-4">
            {reviews.map((rev) => {
              const reviewerName = rev.user?.full_name || "Cliente Hangover";
              const initials = reviewerName.split(" ").map(n => n[0]).slice(0,2).join("").toUpperCase();
              const dateStr = new Date(rev.created_at).toLocaleDateString("es-ES", {
                day: "numeric",
                month: "short",
                year: "numeric"
              });

              return (
                <div key={rev.id} className="pt-4 first:pt-0 flex gap-4">
                  {/* Avatar */}
                  {rev.user?.avatar_url ? (
                    <img
                      src={rev.user.avatar_url}
                      alt={reviewerName}
                      className="w-10 h-10 rounded-full object-cover border border-white/5 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-zinc-850 border border-white/5 flex items-center justify-center text-xs font-bold text-zinc-400 shrink-0">
                      {initials}
                    </div>
                  )}

                  {/* Body */}
                  <div className="space-y-1 flex-grow">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-white text-xs sm:text-sm font-outfit">{reviewerName}</h4>
                        <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-bold px-1.5 py-0.2 rounded flex items-center gap-0.5">
                          ✓ Contrato
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500 flex items-center gap-1 shrink-0">
                        <Calendar className="w-3.5 h-3.5 text-zinc-650" />
                        {dateStr}
                      </span>
                    </div>

                    {/* Stars */}
                    <div className="flex text-amber-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3 h-3 ${star <= rev.rating ? "fill-amber-400" : "text-zinc-850"}`}
                        />
                      ))}
                    </div>

                    {/* Text */}
                    {rev.comment && (
                      <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed whitespace-pre-line pt-1">
                        {rev.comment}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
