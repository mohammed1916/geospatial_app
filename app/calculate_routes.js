import styles from "./utils.js";
import handler from "./demo.js";

async function calculateRoutes(platform, source, destination)
{
    console.log("Calculating routes module...");
    var source = source.latitude + "," + source.longitude;
    var destination = destination.latitude + "," + destination.longitude;

    var newGeoRect = handler.getNewGeoRect();

    const TransportMode = {
        CAR: 'car',
        TRUCK: 'truck',
        PEDESTRIAN: 'pedestrian',
        BICYCLE: 'bicycle',
        SCOOTER: 'scooter',
        TAXI: 'taxi',
        BUS: 'bus',
        PRIVATE_BUS: 'privateBus'
    };

    var transportModeSelect = document.getElementById("transportModeSelect");
    var selectedTransportMode = transportModeSelect.value;

    if (newGeoRect == undefined)
    {
        alert("Please select a region to avoid");
        return;
    }
    const numericValues = Object.values(newGeoRect)
        .filter(value => typeof value === 'number')
        .map(value => value.toFixed(10));

    const resultString = numericValues.join(',');

    console.log("resultString", resultString);




    if (selectedTransportMode === "")
    {
        alert("Please select a transport mode");
    } else
    {
        var routeRequestParams = {
            'transportMode': selectedTransportMode,
            'origin': source,
            'destination': destination,
            'alternatives': document.getElementById("alternatives").value,
            'avoid': {
                areas: { bbox: resultString }
            },

            'units': 'metric',
            'return': 'polyline,travelSummary',
        };
    }
    console.log("routeRequestParams:", routeRequestParams);

    var router = platform.getRoutingService(null, 8);


    handler.calculateRoute(router, routeRequestParams, styles.styles);
}

export default { calculateRoutes };