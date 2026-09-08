"use client";

import React from "react";
import { LinkDrawer } from "./link-drawer";
import { ShortLink } from "@/types";

export interface LinkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  link: ShortLink | null;
  onSuccess?: (updated: ShortLink) => void;
}

export function LinkEditModal({
  isOpen,
  onClose,
  link,
  onSuccess,
}: LinkEditModalProps) {
  return (
    <LinkDrawer
      isOpen={isOpen}
      onClose={onClose}
      mode="edit"
      link={link}
      onSuccess={onSuccess}
    />
  );
}
