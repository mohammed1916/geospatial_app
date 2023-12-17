import { getFirestore, collection, getDocs, doc, getDoc, setDoc, deleteDoc, GeoPoint } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";

import handler from "./demo.js";
import calculateRoutes from "./calculate_routes.js";


async function fetchLocationsFromFirebase()
{
    try
    {
        console.log("Fetching locations from Firestore...");
        console.log("db:", handler.db);
        var sourceDocRef = doc(collection(handler.db, "userlocation"), "source");
        var sourceDocSnap = await getDoc(sourceDocRef);
        var sourceLocation = sourceDocSnap.data().location;

        var destinationDocRef = doc(collection(handler.db, "userlocation"), "destination");
        var destinationDocSnap = await getDoc(destinationDocRef);
        var destinationLocation = destinationDocSnap.data().location;

        return { source: sourceLocation, destination: destinationLocation };

    } catch (error)
    {
        console.error("Error fetching locations from Firestore:", error);
    }
}
// Now you can use the fetchLocationsFromFirebase function in this file

async function navigate()
{
    console.log("Navigating...");
    await fetchLocationsFromFirebase().
        then((locations) =>
        {
            console.log("locations.source:", locations.source);
            console.log("locations.destination:", locations.destination);
            calculateRoutes.calculateRoutes(handler.platform, locations.source, locations.destination);
        });
}

document.getElementById("navigateButton").onclick = navigate;
