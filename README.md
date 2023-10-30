{
    Project Report {
        basicSetup: [nmp i int express ejs mongoose nodemon method-override multer cloudinary multer-storage-cloudinary dotenv],
        touch : app.js,
        connDatabase : RentoBuddy,
        createModule: Listing,
    }


}

MODELS : 

1. Listings Models.
2. Reviews Models.
3. Geocoding : Geocoding is the process of converting address (like a street address) into geographic coordinates (like latitude and longitude ), which you can to place markers on a map, or position the map.

Forward geocoding converts location text into geographic coordinates, turning 2 Lincoln Memorial Circle NW into -77.050,38.889.

Reverse geocoding turns geographic coordinates into place names, turning -77.050, 38.889 into 2 Lincoln Memorial Circle NW. These location names can vary in specificity, from individual addresses to states and countries that contain the given coordinates.



<!-- <script>
  const mapToken = "<%= process.env.MAP_TOKEN %>";
  const coordinates = "<%- JSON.stringify(listing.geometry.coordinates) %>";

</script> -->