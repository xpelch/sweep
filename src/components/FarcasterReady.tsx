"use client";
import { sdk } from "@farcaster/frame-sdk";
import { useEffect } from "react";

export default function FarcasterReady() {
  useEffect(() => {
    sdk.actions.ready();
  }, []);
  return null;
} 