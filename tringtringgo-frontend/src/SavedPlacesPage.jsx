import React, { useEffect, useState } from "react";
import { getUserToken } from "./auth"; // adjust path

function SavedPlacesPage() {
  const [savedPlaces, setSavedPlaces] = useState([]);

  useEffect(() => {
    async function loadSaved() {
      try {
        const token = getUserToken();
        const resp = await fetch(
          "http://127.0.0.1:8000/api/travel/saved-places/",
          {
            headers: { "X-User-Token": token },
          }
        );

        if (!resp.ok) {
          console.warn("Failed to load saved places", resp.status);
          return;
        }

        const data = await resp.json();
        setSavedPlaces(data);
      } catch (err) {
        console.error("Error loading saved places", err);
      }
    }

    loadSaved();
  }, []);

  return <div>{savedPlaces.length} saved places</div>;
}

export default SavedPlacesPage;
