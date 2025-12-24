"use client";

import React, { ReactNode, useEffect, useReducer } from "react";
import {
  SongCreationContext,
  initialState,
  songCreationReducer,
} from "./song-creation-context";

export function EditSongProvider({
  children,
  songId,
}: {
  children: ReactNode;
  songId?: string;
}) {
  const [state, dispatch] = useReducer(songCreationReducer, initialState);

  const clearState = () => {
    dispatch({ type: "CLEAR_STATE" });
  };

  useEffect(() => {
    dispatch({ type: "CLEAR_STATE" });
  }, [songId]);

  const value = {
    state,
    dispatch,
    clearState,
  };

  return (
    <SongCreationContext.Provider value={value}>
      {children}
    </SongCreationContext.Provider>
  );
}
