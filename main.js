require([
	"esri/config",
	"esri/Map",
	"esri/views/MapView",
	"esri/layers/FeatureLayer",
	"esri/rest/support/Query",
	"esri/widgets/Legend",
	"esri/widgets/Expand",
	"esri/widgets/Home"

],  function(esriConfig, Map, MapView, FeatureLayer, Query, Legend, Expand, Home) {

	esriConfig.apiKey = "AAPK5fb49ce91607486f853c85fc999644e6xiAb9dbg67Ewan2Ml35cgxTF6tOf9dl4ZFWinmnGZBJKgoFxF1gEXTLDTgW6_EL7";	
	
	const map = new Map({
		basemap: "arcgis/human-geography-dark"
	});

	const view = new MapView({
		container: "viewDiv",
		map: map,
		center: [-100.579813, 41.129558],
		zoom: 3.8
	});
	
	const clusterConfig = {
		type: "cluster",
		// Daily Acres Sum is a new field created by adding the acres burned (DailyAcres) in each cluster.
		fields: [{
		name: "DailyAcresSum",
		alias: "Daily Acres Sum",
		onStatisticField: "DailyAcres",
		statisticType: "sum"
		}],
		clusterRadius: "100px",
		// {cluster_count} is an aggregate field containing
		// the number of features comprised by the cluster
		popupTemplate: {
		title: "Cluster summary",
		content: "This cluster represents {cluster_count} wildfires totalling {DailyAcresSum} acres.", // make this show comma for thousands
		fieldInfos: [{
		  fieldName: "cluster_count",
		  format: {
			places: 0,
			digitSeparator: true
		  }
		}]
		},
		clusterMinSize: "24px",
		clusterMaxSize: "60px",
		labelingInfo: [{
		deconflictionStrategy: "none",
		labelExpressionInfo: {
		  expression: "Text($feature.cluster_count, '#,###')"
		},
		symbol: {
		  type: "text",
		  color: "#004a5d",
		  haloColor: "white",
		  haloSize: 1.5,
		  font: {
			weight: "bold",
			family: "Noto Sans",
			size: "12px"
		  }
		},
		labelPlacement: "center-center",
		}]
	};
	
	const template = {
		title: "Wildfire Name: {IncidentName}",
		content: "Date Discovered: {FireDiscoveryDateTime}<br />Acres Reported: {DailyAcres}<br />Cause: {FireCause}<br />State: {POOState}",
		fieldInfos: [{
			fieldName: "DailyAcres", // I wanted to replace blanks with 'Unknown', but could not figure out a simple solution.
			format: {
				digitSeparator: true, 
				places: 0 
			}
		},
		]
    };  
	
	const wildfireExpression =  "IncidentTypeCategory = 'WF'"
	
	const layer = new FeatureLayer({
		url: "https://services9.arcgis.com/RHVPKKiFTONKtxq3/ArcGIS/rest/services/USA_Wildfires_v1/FeatureServer/0",
		featureReduction: clusterConfig,
		definitionExpression: wildfireExpression, // Filters to only see wildfires, instead of other types like prescribed burns
		outFields: ["IncidentTypeCategory","IncidentName", "DailyAcres", "FireCause", "FireDiscoveryDateTime", "POOState"], // Reduces output to only necessary fields
		popupTemplate: template
	});

	map.add(layer);
	
	const legend = new Legend({
		view: view
    });

    view.ui.add(legend, "bottom-left"); 
	// It would be cool to only have legend show values that are in the extent/are visible, but I don't think the widget works that way.
	// If you happen to know if there is a simple solution, please let me know.
	
	view.when(function() {
		view.ui.add("paneDiv", "bottom-right");
		document.getElementById("btnQuery").addEventListener("click", getState);
	});
	
	// Let the user filter by state
	function getState() {
		const resultElem = document.getElementById('results');
		resultElem.innerHTML = '';
		const txtName = document.getElementById('txtName');
		const stateName = txtName.value;
		const whereExpression = " AND POOState = '" + stateName + "'"; // builds from wildfireExpression
		layer.definitionExpression = wildfireExpression + whereExpression;
		layer.queryExtent().then(function(results){
			view.goTo(results.extent);
		});
		layer.queryFeatureCount().then(function(count){
			resultElem.innerHTML = 'Found ' + count + ' wildfires in that state';
		})
	}
	
});
  