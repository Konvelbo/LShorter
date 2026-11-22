"use client";

import React from "react";
import { Navbar2 } from "@/components/ui/navbar2";

/**
 * Primary marketing navigation bar backed by the expandable Navbar2 architecture.
 */
export const LandingNavbar = React.memo(function LandingNavbar() {
  return <Navbar2 />;
});

export default LandingNavbar;
