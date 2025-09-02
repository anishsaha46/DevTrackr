import React from "react";

type AvatarProps = {
  className?: string;
  children?: React.ReactNode;
};

export function Avatar({ className = "", children }: AvatarProps) {
  return (
    <div className={`relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gray-200 text-gray-700 ${className}`}>
      {children}
    </div>
  );
}

type AvatarImageProps = {
  src?: string;
  alt?: string;
  className?: string;
};

export function AvatarImage({ src, alt = "avatar", className = "" }: AvatarImageProps) {
  if (!src) return null;
  return (
    <img
      src={src}
      alt={alt}
      className={`h-full w-full object-cover ${className}`}
    />
  );
}

type AvatarFallbackProps = {
  children?: React.ReactNode;
  className?: string;
};

export function AvatarFallback({ children, className = "" }: AvatarFallbackProps) {
  return (
    <span className={`text-sm font-medium ${className}`}>{children}</span>
  );
}
