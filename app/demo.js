import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-analytics.js";
import { getFirestore, collection, getDocs, doc, getDoc, setDoc, deleteDoc, GeoPoint } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";

var keys = {
    HEREAPIkey: "pWeYDWkQb_citdxQIiHestMcjrTwF3M8_QtMkPz657Q",
    firebaseAPIKey: "AIzaSyA3wae6ZSj7TSk1H93kvysUp8bTGetdBh4"
};
const firebaseConfig = {
    apiKey: keys.firebaseAPIKey,
    authDomain: "geospatialroute.firebaseapp.com",
    projectId: "geospatialroute",
    storageBucket: "geospatialroute.appspot.com",
    messagingSenderId: "506176163790",
    appId: "1:506176163790:web:6ca33f6ace74a48ee4259f",
    measurementId: "G-DL11YZXFDJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
var fetched_locations = {};
function geocode(platform, loc)
{
    var geocoder = platform.getSearchService();
    var geocodingParameters = {
        // q: 'Anna university, Chennai'
        q: loc
    };

    geocoder.geocode(
        geocodingParameters,
        onSuccess,
        onError
    );
}
function onSuccess(result)
{
    var locations = result.items;
    addLocationsToMap(locations);
    addLocationsToPanel(locations);
}



function onError(error)
{
    alert('Can\'t reach the remote server');
}

var platform = new H.service.Platform({
    apikey: keys.HEREAPIkey
});
var defaultLayers = platform.createDefaultLayers();

var map = new H.Map(document.getElementById('map'),
    defaultLayers.vector.normal.map, {
    center: { lat: 13.0070665, lng: 80.2558377 },
    zoom: 15,
    pixelRatio: window.devicePixelRatio || 1
});
window.addEventListener('resize', () => map.getViewPort().resize());

var locationsContainer = document.getElementById('panel');

var behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));

var ui = H.ui.UI.createDefault(map, defaultLayers);

var bubble;

function openBubble(position, text)
{
    if (!bubble)
    {
        bubble = new H.ui.InfoBubble(
            position,
            { content: text });
        ui.addBubble(bubble);
    } else
    {
        bubble.setPosition(position);
        bubble.setContent(text);
        bubble.open();
    }
}

async function storeInFirestore(i, address, position)
{
    // Check if the collection "userlocations/route" with the specified index exists
    var index = position.lat + "," + position.lng;
    var collectionRef = collection(db, "userlocation");
    var docRef = doc(collectionRef, "marker");
    var docSnapshot = await getDoc(docRef);

    var firestore_content = {
        houseNumber: address.houseNumber,
        street: address.street,
        district: address.district,
        city: address.city,
        postalCode: address.postalCode,
        county: address.county,
        country: address.countryName,
        position: {
            lat: position.lat,
            lng: position.lng
        }
    };
    fetched_locations[index] = firestore_content;
    console.log("fetched_locations", fetched_locations);
    await setDoc(docRef, { [i]: firestore_content.position }, { merge: true })
        .then(function ()
        {
            console.log("Content stored in Firestore successfully!");
        })
        .catch(function (error)
        {
            console.error("Error storing content in Firestore: ", error);
        });
};

function generateLocationContent(address, position)
{
    var content = '';
    content += '<strong>houseNumber:</strong> ' + address.houseNumber + '<br/>';
    content += '<strong>street:</strong> ' + address.street + '<br/>';
    content += '<strong>district:</strong> ' + address.district + '<br/>';
    content += '<strong>city:</strong> ' + address.city + '<br/>';
    content += '<strong>postalCode:</strong> ' + address.postalCode + '<br/>';
    content += '<strong>county:</strong> ' + address.county + '<br/>';
    content += '<strong>country:</strong> ' + address.countryName + '<br/>';
    content += '<strong>position:</strong> ' +
        Math.abs(position.lat.toFixed(4)) + ((position.lat > 0) ? 'N' : 'S') +
        ' ' + Math.abs(position.lng.toFixed(4)) + ((position.lng > 0) ? 'E' : 'W') + '<br/>';

    return content;
}

function addLocationsToPanel(locations)
{

    var existingNodeOL = document.getElementById("response_list");
    if (existingNodeOL)
    {
        existingNodeOL.remove();
    }
    var nodeOL = document.createElement('ul');
    nodeOL.id = "response_list";

    nodeOL.style.fontSize = 'small';
    nodeOL.style.marginLeft = '5%';
    nodeOL.style.marginRight = '5%';

    for (let i = 0; i < locations.length; i += 1)
    {
        let location = locations[i];
        var li = document.createElement('li'),
            divLabel = document.createElement('div'),
            button = document.createElement('button'),
            address = location.address,
            content = '<strong style="font-size: large;">' + address.label + '</strong></br>';
        var position = location.position;

        storeInFirestore(i, address, position);

        content = generateLocationContent(address, position);
        divLabel.innerHTML = content;
        li.appendChild(divLabel);
        var index = position.lat + "," + position.lng;
        button.id = index;
        button.appendChild(li);
        button.addEventListener('click', function (evt)
        {
            let lastSelectedButton = document.querySelector('.selected');
            if (lastSelectedButton)
            {
                console.log("lastSelectedButton:", lastSelectedButton.id);
                lastSelectedButton.classList.remove('selected');
                lastSelectedButton.dataset.selected = "false";
            }

            this.classList.add('selected');
            console.log(evt.target.innerHTML);
            console.log(location.position);
            map.setCenter(location.position);
            openBubble(location.position, evt.target.innerHTML);
        }, false);

        nodeOL.appendChild(button);
    }
    locationsContainer.appendChild(nodeOL);
}

function addLocationsToMap(locations)
{
    var group = new H.map.Group(),
        position,
        i;

    for (i = 0; i < locations.length; i += 1)
    {
        let location = locations[i];
        var marker = new H.map.Marker(location.position);
        marker.label = location.address.label;
        group.addObject(marker);
    }

    group.addEventListener('tap', function (evt)
    {
        map.setCenter(evt.target.getGeometry());
        openBubble(
            evt.target.getGeometry(), evt.target.label);
    }, false);

    map.addObject(group);
    map.setCenter(group.getBoundingBox().getCenter());
}


var selected_location = ["source", "destination"];
var isSrc = 0;
function srcLocation()
{
    isSrc = 0;
    var src = prompt("Enter source location:");
    geocode(platform, src);
}
function destLocation()
{
    isSrc = 1;
    var dest = prompt("Enter destination location:");
    geocode(platform, dest);
}
async function confirmLocation()
{
    var selectedButton = document.querySelector('.selected');
    if (selectedButton)
    {
        console.log("Selected location:", selectedButton.id);
    } else
    {
        console.log("No location selected");
        return;
    }

    var confirm_location = selectedButton.id;
    var confirmation = confirm("Do you want to confirm this location?\n\n" + confirm_location);
    if (confirm_location)
    {
        console.log("Location confirmed:", confirm_location);
        var index = confirm_location.split(",");
        var L_position = {
            lat: parseFloat(index[0]),
            lng: parseFloat(index[1])
        };
        var geoPoint = new GeoPoint(L_position.lat, L_position.lng);


        console.log("selected_location[isSrc]:", selected_location[isSrc]);
        var collectionRef = collection(db, "userlocation");
        var docRef = doc(collectionRef, selected_location[isSrc]);

        await setDoc(docRef, { location: geoPoint }, { merge: true })
            .then(function ()
            {
                console.log("location inserted into Firestore");
            })
            .catch(function (error)
            {
                console.error("Error inserting location into Firestore: ", error);
            });
    } else
    {
        console.log("Location confirmation canceled");
    }
}








/*------------------------------------------------------------------------------------------------------------------------------------- */
/*------------------------------------------------------------------------------------------------------------------------------------- */
/*-------------------------------------------------Create Rect------------------------------------------------------------------ */
/*------------------------------------------------------------------------------------------------------------------------------------- */
/*------------------------------------------------------------------------------------------------------------------------------------- */



var pointer,
    pointerGeoPoint,
    currentGeoRect,
    objectTopLeftScreen,
    objectBottomRightScreen,
    newGeoRect,
    RectGroups = [],
    areas = [];

document.getElementById('addRectButton').addEventListener('click', function ()
{
    addResizableRect(map, behavior);
});

function addResizableRect(map, behavior)
{
    var initialRect =
        new H.geo.Rect(
            map.getCenter().lat - 0.001,
            map.getCenter().lng - 0.001,
            map.getCenter().lat + 0.001,
            map.getCenter().lng + 0.001
        );

    createResizableRect(map, behavior, initialRect);
}

function removeRectGroups()
{
    for (var i = 0; i < RectGroups.length; i++)
    {
        map.removeObject(RectGroups[i]);
    }
    RectGroups = [];
    newGeoRect = undefined;
}

function createResizableRect(map, behavior, initialRect)
{
    var rect = new H.map.Rect(
        initialRect,
        {
            style: { fillColor: 'rgba(100, 100, 100, 0.5)', lineWidth: 0 }
        }
    ),
        rectOutline = new H.map.Polyline(
            rect.getGeometry().getExterior(),
            {
                style: { lineWidth: 8, strokeColor: 'rgba(255, 0, 0, 0)', fillColor: 'rgba(0, 0, 0, 0)', lineCap: 'square' }
            }
        ),
        rectGroup = new H.map.Group({
            volatility: true,
            objects: [rect, rectOutline]
        }),
        rectTimeout;

    RectGroups.push(rectGroup);


    rect.draggable = true;
    rectOutline.draggable = true;
    rectOutline.getGeometry().pushPoint(rectOutline.getGeometry().extractPoint(0));

    map.addObject(rectGroup);

    rectGroup.addEventListener('pointerenter', function (evt)
    {
        var currentStyle = rectOutline.getStyle(),
            newStyle = currentStyle.getCopy({
                strokeColor: 'rgb(255, 0, 0)'
            });

        if (rectTimeout)
        {
            clearTimeout(rectTimeout);
            rectTimeout = null;
        }
        rectOutline.setStyle(newStyle);
    }, true);

    rectGroup.addEventListener('pointerleave', function (evt)
    {
        var currentStyle = rectOutline.getStyle(),
            newStyle = currentStyle.getCopy({
                strokeColor: 'rgba(255, 0, 0, 0)'
            }),
            timeout = (evt.currentPointer.type == 'touch') ? 1000 : 0;

        rectTimeout = setTimeout(function ()
        {
            rectOutline.setStyle(newStyle);
        }, timeout);


        document.body.style.cursor = 'default';
    }, true);

    rectGroup.addEventListener('pointermove', function (evt)
    {
        var pointer = evt.currentPointer,
            objectTopLeftScreen = map.geoToScreen(evt.target.getGeometry().getBoundingBox().getTopLeft()),
            objectBottomRightScreen = map.geoToScreen(evt.target.getGeometry().getBoundingBox().getBottomRight()),
            draggingType = '';

        if (evt.target != rectOutline)
        {
            return;
        }

        if (pointer.viewportX < (objectTopLeftScreen.x + 4))
        {
            document.body.style.cursor = 'ew-resize';
            draggingType = 'left';
        } else if (pointer.viewportX > (objectBottomRightScreen.x - 4))
        {
            document.body.style.cursor = 'ew-resize';
            draggingType = 'right';
        } else if (pointer.viewportY < (objectTopLeftScreen.y + 4))
        {
            document.body.style.cursor = 'ns-resize';
            draggingType = 'top';
        } else if (pointer.viewportY > (objectBottomRightScreen.y - 4))
        {
            document.body.style.cursor = 'ns-resize';
            draggingType = 'bottom';
        } else
        {
            document.body.style.cursor = 'default';
        }

        if (draggingType == 'left')
        {
            if (pointer.viewportY < (objectTopLeftScreen.y + 4))
            {
                document.body.style.cursor = 'nwse-resize'; // mouse position is at the top-left corner
                draggingType = 'left-top';
            } else if (pointer.viewportY > (objectBottomRightScreen.y - 4))
            {
                document.body.style.cursor = 'nesw-resize'; // mouse position is at the bottom-left corner
                draggingType = 'left-bottom';
            }
        } else if (draggingType == 'right')
        {
            if (pointer.viewportY < (objectTopLeftScreen.y + 4))
            {
                document.body.style.cursor = 'nesw-resize';
                draggingType = 'right-top';
            } else if (pointer.viewportY > (objectBottomRightScreen.y - 4))
            {
                document.body.style.cursor = 'nwse-resize';
                draggingType = 'right-bottom';
            }
        }

        rectGroup.setData({ 'draggingType': draggingType });
    }, true);

    rectGroup.addEventListener('dragstart', function (evt)
    {
        if (evt.target === rectOutline)
        {
            behavior.disable();
        }
    }, true);

    rectGroup.addEventListener('drag', function (evt)
    {
        pointer = evt.currentPointer,
            pointerGeoPoint = map.screenToGeo(pointer.viewportX, pointer.viewportY);
        currentGeoRect = rect.getGeometry().getBoundingBox(),
            objectTopLeftScreen = map.geoToScreen(currentGeoRect.getTopLeft()),
            objectBottomRightScreen = map.geoToScreen(currentGeoRect.getBottomRight());

        if (evt.target instanceof H.map.Polyline)
        {
            var currentTopLeft = currentGeoRect.getTopLeft(),
                currentBottomRight = currentGeoRect.getBottomRight(),
                outlineLinestring;

            switch (rectGroup.getData()['draggingType'])
            {
                case 'left-top':
                    if (pointerGeoPoint.lng >= currentBottomRight.lng || pointerGeoPoint.lat <= currentBottomRight.lat)
                    {
                        return;
                    }
                    newGeoRect = H.geo.Rect.fromPoints(pointerGeoPoint, currentGeoRect.getBottomRight());
                    break;
                case 'left-bottom':
                    if (pointerGeoPoint.lng >= currentBottomRight.lng || pointerGeoPoint.lat >= currentTopLeft.lat)
                    {
                        return;
                    }
                    currentTopLeft.lng = pointerGeoPoint.lng;
                    currentBottomRight.lat = pointerGeoPoint.lat;
                    newGeoRect = H.geo.Rect.fromPoints(currentTopLeft, currentBottomRight);
                    break;
                case 'right-top':
                    if (pointerGeoPoint.lng <= currentTopLeft.lng || pointerGeoPoint.lat <= currentBottomRight.lat)
                    {
                        return;
                    }
                    currentTopLeft.lat = pointerGeoPoint.lat;
                    currentBottomRight.lng = pointerGeoPoint.lng;
                    newGeoRect = H.geo.Rect.fromPoints(currentTopLeft, currentBottomRight);
                    break;
                case 'right-bottom':
                    if (pointerGeoPoint.lng <= currentTopLeft.lng || pointerGeoPoint.lat >= currentTopLeft.lat)
                    {
                        return;
                    }
                    newGeoRect = H.geo.Rect.fromPoints(currentGeoRect.getTopLeft(), pointerGeoPoint);
                    break;
                case 'left':
                    if (pointerGeoPoint.lng >= currentBottomRight.lng)
                    {
                        return;
                    }
                    currentTopLeft.lng = pointerGeoPoint.lng;
                    newGeoRect = H.geo.Rect.fromPoints(currentTopLeft, currentGeoRect.getBottomRight());
                    break;
                case 'right':
                    if (pointerGeoPoint.lng <= currentTopLeft.lng)
                    {
                        return;
                    }
                    currentBottomRight.lng = pointerGeoPoint.lng;
                    newGeoRect = H.geo.Rect.fromPoints(currentGeoRect.getTopLeft(), currentBottomRight);
                    break;
                case 'top':
                    if (pointerGeoPoint.lat <= currentBottomRight.lat)
                    {
                        return;
                    }
                    currentTopLeft.lat = pointerGeoPoint.lat;
                    newGeoRect = H.geo.Rect.fromPoints(currentTopLeft, currentGeoRect.getBottomRight());
                    break;
                case 'bottom':
                    if (pointerGeoPoint.lat >= currentTopLeft.lat)
                    {
                        return;
                    }
                    currentBottomRight.lat = pointerGeoPoint.lat;
                    newGeoRect = H.geo.Rect.fromPoints(currentGeoRect.getTopLeft(), currentBottomRight);
                    break;
            }

            rect.setBoundingBox(newGeoRect);

            outlineLinestring = rect.getGeometry().getExterior();
            outlineLinestring.pushPoint(outlineLinestring.extractPoint(0));
            rectOutline.setGeometry(outlineLinestring);
            console.log("rectOutline:", rectOutline);

            evt.stopPropagation();
        }
    }, true);

    rectGroup.addEventListener('dragend', function (evt)
    {
        behavior.enable();
    }, true);
}








/*------------------------------------------------------------------------------------------------------------------------------------- */
/*------------------------------------------------------------------------------------------------------------------------------------- */
/*-------------------------------------------------Add points------------------------------------------------------------------ */
/*------------------------------------------------------------------------------------------------------------------------------------- */
/*------------------------------------------------------------------------------------------------------------------------------------- */

var points = [];
var vertices = [];
var result;
var setBounds = false;
var setBounds2 = false;



/*------------------------------------------------------------------------------------------------------------------------------------- */
/*------------------------------------------------------------------------------------------------------------------------------------- */
/*-------------------------------------------------Encoding --------------------------------------------------------------------- */
/*------------------------------------------------------------------------------------------------------------------------------------- */
/*------------------------------------------------------------------------------------------------------------------------------------- */


function convertToGeoJSON(inputArray)
{
    const coordinates = [];

    for (let i = 0; i < inputArray.length; i += 3)
    {
        const lat = inputArray[i];
        const lng = inputArray[i + 1];
        coordinates.push({ lat, lng });
    }

    const geoJSONPolygon = {
        type: "polygon",
        inner: coordinates
    };

    return geoJSONPolygon;
}



















/*------------------------------------------------------------------------------------------------------------------------------------- */
/*------------------------------------------------------------------------------------------------------------------------------------- */
/*-------------------------------------------------Calculate Route--------------------------------------------------------------------- */
/*------------------------------------------------------------------------------------------------------------------------------------- */
/*------------------------------------------------------------------------------------------------------------------------------------- */

var routes = new H.map.Group();


async function calculateRoutes(platform, source, destination)
{
    result = await convertToGeoJSON(vertices);
    var source = source.latitude + "," + source.longitude;
    var destination = destination.latitude + "," + destination.longitude;

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

    var styles = [
        { // blue
            strokeColor: 'rgba(0, 0, 0, .7)',
            lineWidth: 10
        },
        {// pink
            strokeColor: 'rgba(0, 255, 0, .7)',
            lineWidth: 7
        },
        {// green
            strokeColor: 'rgba(25, 150, 10, 0.5)',
            lineWidth: 5
        },
        {// Red
            strokeColor: 'rgba(255, 0, 0, 0.7)',
            lineWidth: 6
        },
        {// cyan
            strokeColor: 'rgba(0, 255, 255, 0.7)',
            lineWidth: 9
        },
        {// yellow
            strokeColor: 'rgba(255, 255, 0, 0.7)',
            lineWidth: 11
        }
    ];
    calculateRoute(router, routeRequestParams, styles);
}

var routesDrawn = [];
function calculateRoute(router, params, style)
{
    console.log("params.avoid.areas.bbox", params.avoid.areas.bbox);
    if (setBounds == true)
    {
        params.avoid.areas.bbox = "80.2240791635,80.2568169972,13.0024661797,12.9967007159";
    }
    if (setBounds2 == true)
    {
        params.avoid.areas.bbox = "80.2459495520,80.2496444924,13.0307381059,13.0263024954";
    }
    var url;
    url = `https://router.hereapi.com/v8/routes?apikey=${keys.HEREAPIkey}&transportMode=${params.transportMode}&origin=${params.origin}&destination=${params.destination}&alternatives=${params.alternatives}&avoid[areas]=bbox:${params.avoid.areas.bbox}&units=metric&return=polyline%2CtravelSummary`;
    if (document.getElementById("alternatives").value == 0)
    {
        url = `https://router.hereapi.com/v8/routes?apikey=${keys.HEREAPIkey}&transportMode=${params.transportMode}&origin=${params.origin}&destination=${params.destination}&avoid[areas]=bbox:${params.avoid.areas.bbox}&units=metric&return=polyline%2CtravelSummary`;
    }
    fetch(url).then((result) =>
    { result = result.json(); return result; }).then((result) =>
    {
        if (routesDrawn.length > 0)
        {
            console.log("Removing outesDrawn:", routesDrawn);
            console.log("Removing outesDrawn.length:", routesDrawn.length);
            for (var i = 0; i < routesDrawn.length; i++)
            {
                console.log("Removing outesDrawn:", i, routesDrawn[i]);
                routes.removeObject(routesDrawn[i]);
            }
        }
        if (result && result.routes)
        {
            console.log("result:", result);
            console.log("result.routes:", result.routes);
            for (var i = 0; i < result.routes.length; i++)
            {
                addRouteShapeToMap(style[i], result.routes[i]);
            }
        } else
        {
            console.error('No routes found in the result.');
        }
    }, console.error);
}

function toggleSetBoundRect()
{
    setBounds = !setBounds;
    this.classList.toggle("toggle-button", setBounds);
    console.log("setBounds:", setBounds);
    var initialRect =
        new H.geo.Rect(
            13.0024661797,
            80.2240791635,
            12.9967007159,
            80.2568169972
        );

    createResizableRect(map, behavior, initialRect);
}
function toggleSetBoundRect2()
{
    setBounds2 = !setBounds2;
    this.classList.toggle("toggle-button", setBounds2);
    console.log("setBounds2:", setBounds2);

    var initialRect =
        new H.geo.Rect(
            13.0307381059,
            80.2459495520,
            13.0263024954,
            80.2496444924
        );

    createResizableRect(map, behavior, initialRect);
}


var mapContainer = document.getElementById('map');

var defaultLayers = platform.createDefaultLayers();


map.addObject(routes);

function addRouteShapeToMap(style, route)
{
    route.sections.forEach((section) =>
    {
        let linestring = H.geo.LineString.fromFlexiblePolyline(section.polyline);

        let polyline = new H.map.Polyline(linestring, {
            style: style
        });
        console.log("polyline", polyline);
        routesDrawn.push(polyline);
        routes.addObject(polyline);
        map.getViewModel().setLookAtData({
            bounds: routes.getBoundingBox()
        });
    });
}


async function fetchLocationsFromFirebase()
{
    try
    {
        var sourceDocRef = doc(collection(db, "userlocation"), "source");
        var sourceDocSnap = await getDoc(sourceDocRef);
        var sourceLocation = sourceDocSnap.data().location;

        var destinationDocRef = doc(collection(db, "userlocation"), "destination");
        var destinationDocSnap = await getDoc(destinationDocRef);
        var destinationLocation = destinationDocSnap.data().location;

        return { source: sourceLocation, destination: destinationLocation };

    } catch (error)
    {
        console.error("Error fetching locations from Firestore:", error);
    }
}

async function navigate()
{
    console.log("Navigating...");
    await fetchLocationsFromFirebase().
        then((locations) =>
        {
            console.log("locations.source:", locations.source);
            console.log("locations.destination:", locations.destination);
            calculateRoutes(platform, locations.source, locations.destination);
        });
}

document.getElementById("srcButton").onclick = srcLocation;
document.getElementById("destButton").onclick = destLocation;
document.getElementById("confirmLocationButton").onclick = confirmLocation;
document.getElementById("navigateButton").onclick = navigate;
document.getElementById("removeRectButton").onclick = removeRectGroups;
document.getElementById("toggleSetBoundRectButton").onclick = toggleSetBoundRect;
document.getElementById("toggleSetBoundRectButton2").onclick = toggleSetBoundRect2;
