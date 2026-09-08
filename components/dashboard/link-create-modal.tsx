"use client";

import React from "react";
import { LinkDrawer } from "./link-drawer";
import { ShortLink } from "@/types";

export interface LinkCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (created: ShortLink) => void;
  initialUrl?: string;
}

export function LinkCreateModal({
  isOpen,
  onClose,
  onSuccess,
  initialUrl = "",
}: LinkCreateModalProps) {
  return (
    <LinkDrawer
      isOpen={isOpen}
      onClose={onClose}
      mode="create"
      initialUrl={initialUrl}
      onSuccess={onSuccess}
    />
  );
}
