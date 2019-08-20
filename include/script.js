
/* ***************************************************************** */
/*         GESTION INTERFACE UTILISATEUR                             */
/* ***************************************************************** */

var GuiMessage = {
	_unreadCount : 0,
	_highestAlertLevel:-1, // cf. this._setLevel() for semantics
	init: function(){
		$("#message-box #icon-box").click(function(){
			if ($("#message-box").hasClass("open"))
				GuiMessage.close();
			else
				GuiMessage.open();
		});
		
		$("#message-box").click(function(evt){
			if (evt.target !== this) return; // only if click _directly_ on background
			GuiMessage.close();
		}); 
		
		$("#message-box #trashcan-button").click(function(){
			//if (confirm("Effacer tous les messages ?")) : pourquoi confirmer, au fond il n'y a pas d'enjeu...
			GuiMessage.clear();
		});
   
		this.clear();
	},
	open: function(){
		$("#message-box").addClass("open");
		this._clrUnread();
		
		// delayed scroll
		var jqTextBox = $("#message-box #text-box");
		if (jqTextBox.data("scroll-when-shown")){
			jqTextBox.scrollTop(jqTextBox.prop("scrollHeight"));
			jqTextBox.data("scroll-when-shown", false);
		}
	},
	close: function(){
		$("#message-box").removeClass("open");
		this._clrUnread();
	},
	
	_levelClassname: function(lvl){
		var lvl_class;
		switch (lvl) {
			case 0: lvl_class = "lvl_info"; break;
			case 1: lvl_class = "lvl_ok"; break;
			case 2: lvl_class = "lvl_warning"; break;
			case 3: lvl_class = "lvl_error"; break;
			default: lvl_class = "lvl_unidentified"; break; //usnused, for debug purpose
		}
		return lvl_class;
	},
	_setHighestLevel: function(lvl, resetMode) {
		if (resetMode === true)
			this._highestAlertLevel = lvl;
		else
			if (lvl > this._highestAlertLevel) this._highestAlertLevel = lvl;
			
		$("#message-box").removeClass("lvl_info lvl_ok lvl_warning lvl_error").addClass(this._levelClassname(this._highestAlertLevel));
	},
	
	_clrUnread: function() {
		this._unreadCount = 0;
		$("#message-box #unread-counter").hide();
	},
	_incUnread: function() {
		this._unreadCount ++;
		$("#message-box #unread-counter").empty().text(this._unreadCount).show();
	},
	
	
	clear: function(){
		this._clrUnread();
		this._setHighestLevel(0, true);
		this.close();
		$("#message-box #text-box").empty();
	},
	
	_addMessage: function(msg, lvl){
		this._incUnread();
		this._setHighestLevel(lvl);
		
		var jqTextBox = $("#message-box #text-box");
		var msg_elt = $("<div class=\"message "+ this._levelClassname(lvl) +"\"><div class=\"icon-box\"></div></div>").append($("<span></span>").text(msg));
		jqTextBox.append(msg_elt);
		
		/* optionnel : si niveau >= warning, forcer l'affichage du message
		if (lvl >= 2) this.open(); */
		
		jqTextBox.scrollTop(jqTextBox.prop("scrollHeight"));
		jqTextBox.data("scroll-when-shown",true); // flag for delayed scroll ; when hidden, direct scroll doesn't work
	},
	
	info: function(msg){ this._addMessage(msg, 0);},
	ok: function(msg){ this._addMessage(msg, 1);},
	warn: function(msg){ this._addMessage(msg, 2);},
	error: function(msg){ this._addMessage(msg, 3);},
};

var EntryState = {
	_entryStates: {}, // to be initialized
	
	clear: function(){
		this.setFieldState("amazon-datafile", false);
		this.setFieldState("pallet-datafile", false);
		this.setFieldState("shipToCbb", false);
		this.setFieldState("asn-override", false);
	},
	
	setFieldState: function (field_id,state) {
		switch(field_id){
			case "amazon-datafile":
			case "pallet-datafile":
			case "shipToCbb":
			case "asn-override":
			 	var isOk;
			 	var stateClass;
				if (typeof state === 'undefined') {
			 		isOk = false; stateClass = "isPending";
				} else if (state) {
					isOk = true; stateClass = "isOk";
				} else if (!state) {
					isOk = false; stateClass = "isError";
				}
				this._entryStates[field_id] = isOk;
				$("#user-gui #stateof-"+ field_id +".state-icon").removeClass("isOk isError isPending").addClass(stateClass);
				break;
			default:
				alert("error EntryState.setFieldState() on \"field_id\" arg : " + field_id);
		}
		var isEverythingOk = (this._entryStates["amazon-datafile"] && this._entryStates["pallet-datafile"] &&
		  this._entryStates["shipToCbb"] && this._entryStates["asn-override"]);
		$("#user-gui #to-print-mode").prop("disabled", !isEverythingOk);
	}
};	



/* ***************************************************************** */
/*         CALCULS ET RENDUS                                         */
/* ***************************************************************** */

(function( $ ) {
 $.fn.populateStickerBarcode = function(fieldPrefix, value) { 
	let barHeight = 40
	if (fieldPrefix.indexOf('container_id') != -1) {
		barHeight = 60
	}
	var barcodeSettings = {
		addQuietZone: true,
		barWidth: 2, barHeight: barHeight, // TODO : rendre taille d'affichage réelle gérable par CSS ?
		color: "black",
		bgColor: "transparent",
		showHRI: false, // HRI du plugin inutilisé, remplacé par version custom
		output: "bmp" // TODO support switching BMP, CSS etc. ?
	};
    	
        this.filter( "div.sticker" ).each(function() {        	
		var jqLabel = $( this );			
		jqLabel.find(fieldPrefix + " .value").empty().append(value);
		jqLabel.find(fieldPrefix + " .barcode").barcode(value, "code39", barcodeSettings);
		jqLabel.find(fieldPrefix + " .barcode-hri").empty().append("*"+value+"*");
        });
 
        return this; 
 };
 
 $.fn.populatePalletNumber = function(pallet_number) {
        this.filter( "div.sticker" ).each(function() {        	
		var jqLabel = $( this );
		if (pallet_number) {
			jqLabel.find(".pallet_number").prop("contentEditable", false).css("background", "").css("min-width", "")
			 .empty().append("P"+pallet_number);
		} else {
			if (jqLabel.find(".pallet_number").prop("contentEditable") != "true")
				jqLabel.find(".pallet_number").prop("contentEditable", true).css("background", "pink").css("min-width", "1em")
				 .empty();
			/* else no change, keep user entry */
		}
        });
 
        return this;
 };
}( jQuery ));


/* *** Gestion datasource principale CSV, dit "fichier A" *** */
var AmzContainers = {
	_containers: [],
		
	clear: function(){
		this._containers = [];
	},
	
	extractItemRows: function(rows){
		if (rows.length == 0) {
			GuiMessage.error("Fichier A vide");
			return -1;
		}
		if (rows[0].length < 7){
			/* check type fichier : test nombre colonnes, sur 1ère ligne seulement) */
			GuiMessage.error("Fichier A attendu avec 7 colonnes min. (seulement " + rows[0].length + " trouvés)");
			return -1;
		}
		GuiMessage.info("Fichier A, Lignes lues : " + (rows.length - 1) + "  (header non-compris)"); // header non-compris			
		
		/* 1) Groupage des lignes par carton */
		var groupsByContainer = {}; // obj. "tableau associatif" des étiquettes, par container_id (= nombre de suivi du carton). Attention, ce dernier doit être un attribut obj JS valide !
		for (var i=1; i<rows.length; i++) {// skip first  (pour "PapaParse::header: false")
	
			/* 1.a) Mapping fichier CSV */
			var order_id     = rows[i][0]; // Numéro de commande
			var container_id = rows[i][5]; // Numéro de suivi du carton
			var item_id      = "" +rows[i][1]; // UPC/EAN/ISBN
			var item_desc    = rows[i][4]; // Description de l'article
			var item_count   = rows[i][6]; // Quantité totale de l'expédition
			var item_asin    = EanList[item_id]; // Asin de l'ean
			
			if (item_asin != rows[i][3]) {
				if ( item_asin == undefined) {
					GuiMessage.warn("Fichier A, Ligne " + i +" EAN(A):" + item_id + " n'est pas trouvé dans la list ean-amazon"); 
				} else {
					GuiMessage.warn("Fichier A, Ligne " + i +" ASIN et EAN ne correspondent pas. EAN(A):" + item_id + " ASIN(A):" + rows[i][3] + " ASIN(ean-amazon):" + item_asin); 
				}
			}
			if (!isNaN(item_count)) {
				item_count = parseInt(item_count, 10);
			} else {
				GuiMessage.warn("Fichier A, Ligne " + i + "\"Quantité\" non-numérique (=" + item_count + "), considéré comme zéro"); 
				console.log("Error : QTY (col. 6) not numerical", rows[i]);
				item_count = 0;			
			}
			// ... et colonnes inutilisés :
			// [2] Numéro de modèle
			// [3] ASIN
			// [7] Date d'expiration (produits périssables uniquement)
			// [8] Numéro de lot
			
			/* 1.b) création de ligne "Carton" en fonction des lignes "Produit" */
			var container = groupsByContainer[container_id];
			if (container){
				//-- lignes supplémentaires (2e et suivantes) du même carton
				if (item_id != container.item_id) {
					container.item_id = "EAN MIXTE";
				}
				container.item_count += item_count;
			} else {
				//-- 1ère ligne d'un carton (tous cartons, homogènes ou mixtes)
				groupsByContainer[container_id]
				 = container 
				 = {
					order_id    : order_id  ,
					container_id: container_id,
					item_id     : item_id   ,
					item_desc   : item_desc ,
					item_count  : item_count,
					item_asin   : item_asin,
				};
			}			
		}
		
		/* 2) indexation des cartons et transfert dans liste globale */
		var containersGroupedByItemId = {}; // key=item_id with prefix, value=array of containers		
		
		var keys = Object.keys(groupsByContainer);
		keys.sort(); // L'ordre de numérotation est donc l'ordre des container_id 
		for (var i=0; i<keys.length; i++) {
			var container = groupsByContainer[keys[i]];
			this._containers.push(container);
			
			container.container_index = i+1; // c.à d. index dans l'ordre des container_id croissants
			container.container_count = keys.length;
			
			// opé. supplém. : préparation calcul de repartition_index et repartition_count
			var containerArray = containersGroupedByItemId["item_" + container.item_id];
			if (containerArray){
				containerArray.push(container);
			} else {
				containersGroupedByItemId["item_" + container.item_id] = [container];
			}
		}				
		$("#user-gui #container-count-original").val(keys.length); // = initial value (before override)
				
		/* 3) calcul de repartition_index et repartition_count */
		keys = Object.keys(containersGroupedByItemId);
		for (var i=0; i<keys.length; i++) {
			var containerArray = containersGroupedByItemId[keys[i]];

			for (var j=0; j<containerArray.length; j++){
				var container = containerArray[j];

				container.repartition_index = (j+1);
				container.repartition_count = containerArray.length;				
			}
		}
		return this._containers.length; // nb de cartons
	},
	
	renderAllStickers : function(){
		$("#printable-zone #result-zone").empty();
		
		var pageTemplate = $("#printable-zone #template-zone .page").clone();
		pageTemplate.find(".template-specific").remove();				
		var labelTemplate = pageTemplate.find(".sticker");
		labelTemplate.remove();
		
		var max_stickersPerPage = pageTemplate.data("max-stickers");
		if (!isNaN(max_stickersPerPage)) {
			max_stickersPerPage = parseInt(max_stickersPerPage, 10);
			GuiMessage.info("Nombre d'étiquettes par page : " + max_stickersPerPage);
		} else {
			GuiMessage.warn("Erreur de template - nombre d'étiquettes par page mal spécifié (=" + max_stickersPerPage + "), donc mis par défaut à 1"); 
			max_stickersPerPage = 1;
		}		

		
		var current_page = pageTemplate.clone();
		var current_stickersPerPage = 0;
		var pageCount = 0;
		for (var i=0; i<this._containers.length; i++) {
			var container = this._containers[i];
						
			var newLabel = labelTemplate.clone();			
			newLabel.attr("internal_index", i);			
			
			newLabel.populateStickerBarcode(".order_id", container.order_id);
			
			newLabel.populateStickerBarcode(".container_id", container.container_id); // remarque: type=code39, pas code 128 comme indiqué ?!
			
			newLabel.find(".item_id .value").empty().append(container.item_id);
			
			newLabel.find(".item_desc .value").empty().append(container.item_desc);
			newLabel.find(".item_count .value").empty().append(container.item_count);

			newLabel.find(".container_index .value").empty().append(container.container_index);
			newLabel.find(".container_count .value").empty().append(container.container_count);

			
			newLabel.find(".repartition_index").empty().append(container.repartition_index);
			newLabel.find(".repartition_count").empty().append(container.repartition_count);
			
			newLabel.populatePalletNumber(container.pallet_number);
			
			current_page.append(newLabel);
			current_stickersPerPage++;
			if (current_stickersPerPage >= max_stickersPerPage){
				$("#printable-zone #result-zone").append(current_page);
				pageCount++;
				
				current_page = pageTemplate.clone();
				current_stickersPerPage = 0;
			}
		}
		
		if (current_stickersPerPage > 0){
			$("#printable-zone #result-zone").append(current_page);
			pageCount++;
		}
		return pageCount;
	},
	
	updatePalletNumbers: function(){
		for (var i=0; i<this._containers.length; i++) {
			var container = this._containers[i];
			
			var currentLabel = $("#printable-zone #result-zone .sticker[internal_index="+ i +"]");
			currentLabel.populatePalletNumber(container.pallet_number);
		}
	},			
};



/* *** Gestion données complémentaires CSV "numéro de palettes", dit "fichier P" *** */
var PalletContent = {
	_palletRows: [],
		
	clear: function(){
		this._palletRows = [];
		AmzContainers._containers.forEach(function(container){
			container.pallet_number = "";
		});
	},
	
	captureRows: function(rows){
		if (rows.length == 0) {
			GuiMessage.error("Fichier P vide");
			return -1;
		}
		if (rows[0].length < 2){
			/* check type fichier : test nombre colonnes, sur 1ère ligne seulement) */
			GuiMessage.error("Fichier P attendu avec 2 colonnes min. (numéro de palette et EAN)");
			return -1;
		}
		if (rows[0].length >= 7){
			/* check confusion avec fichier A (à supposer que le fichier P reste plus petit !...) */
			GuiMessage.error("Fichier P avec trop de colonnes, confusion possible fichier A ? (" + rows[0].length + " colonnes trouvées)");
			return -1;
		}

		var match_item_count;
		if (rows[0].length == 2){
			/* mode dégradé "2 colonnes" (de fait, on remarque que la quantité ne varie "jamais" avec les colis "non-mixtes") */
			GuiMessage.warn("Fichier P avec 2 colonnes (numéro de palette et EAN) : mode simplifié");
			match_item_count = false;
		} else {
			/* mode normal "3 colonnes" */
			GuiMessage.info("Fichier P avec au moins 3 colonnes (numéro de palette, EAN et quantité) : mode normal");
			match_item_count = true;			
		}
		GuiMessage.info("Fichier P Lignes lues dans : " + rows.length + " (header éventuel compris)"); // header éventuel compris
		
		for (var i=0; i<rows.length; i++) {
			var palletCsvRow = rows[i];
	
			/* 1) Mapping fichier CSV */
			var pallet_number = palletCsvRow[0]; // Numéro de palette
			var item_id       = "" + palletCsvRow[1]; // EAN 
			var item_count    = (match_item_count ? palletCsvRow[2] : -1); // Quantité
			var item_asin = EanList[item_id];
			

			if (i==0 && isNaN(pallet_number)) continue; // header row probable : skip first

			if (!isNaN(item_count)) {
				item_count = parseInt(item_count, 10);
			} else {
				GuiMessage.warn("Fichier P, ligne " + i + ": \"Quantité\" non-numérique (=" + item_count + ") : seul l'EAN sera utilisé sur cette ligne");
				item_count = -1;
			}
					
			if (item_asin ==  undefined && "EAN MIX" != item_id) {
				GuiMessage.warn("Fichier P, ligne " + i + " ean "+ item_id +" non trouvé dans ean-amazon");
			}
			
			/* 2) création de ligne "palette" */
			this._palletRows.push({
				item_id : item_id,
				item_count : item_count,
				pallet_number : pallet_number,
				item_asin : item_asin
			});
		}
		
		return this._palletRows.length;
	},
	
	resolvePalletIds: function(){
		if ((AmzContainers._containers.length == 0) || (this._palletRows.length == 0))
			return 0;
		
		var container_dispatch = [];
		for (var j=0; j<AmzContainers._containers.length; j++){
			//var container = AmzContainers._containers[j]; inutilisé... pour le moment
			container_dispatch[j] = -1;
		}		
		
		var pallet_dispatch = [];
		for (var i=0; i<this._palletRows.length; i++){
			var palletRow = this._palletRows[i];
			pallet_dispatch[i] = -1;
			for (var j=0; j<AmzContainers._containers.length; j++){
				var container = AmzContainers._containers[j];
				
				if (container_dispatch[j] >= 0) continue; // colis déjà attribué
				
				if ((palletRow.item_asin == container.item_asin && !palletRow.item_asin && !container.item_asin) // attention : comparaisons transtypes potentielles.. et voulues !
				 && (palletRow.item_count == -1 || palletRow.item_count == container.item_count)) {
				 	container_dispatch[j] = i;
				 	pallet_dispatch[i] = j;
					break;
				}
			}
		}

		// report matching + reinject pallet_numbers into containers
		for (var i=0; i<this._palletRows.length; i++){
			var palletRow = this._palletRows[i];
			
			var attributed_container_index = pallet_dispatch[i];
			if (attributed_container_index < 0) {
				GuiMessage.warn("Fichier P, Ligne "+ (i+1) +" n'a pas été utilisée pour attribuer un numéro de palette (ean=" + palletRow.item_id 
					+ (palletRow.item_count!=-1? ", qté="+ palletRow.item_count : "") 
					+", palette="+ palletRow.pallet_number +")");
			}
		}
		
		var resolvedCount = 0;
		for (var j=0; j<AmzContainers._containers.length; j++){
			var container = AmzContainers._containers[j];
			
			var attributed_palletRow_index = container_dispatch[j];
			if (attributed_palletRow_index >= 0) {
				var attributed_palletRow = this._palletRows[attributed_palletRow_index];
				container.pallet_number = attributed_palletRow.pallet_number;
				resolvedCount++;
			} else {
				container.pallet_number = "";
				GuiMessage.warn("Numéro de palette non-attribué sur colis "+ container.container_index +"/"+ container.container_count +": "
				  + container.container_id +" (ean="+ container.item_id +", qté="+ container.item_count +")");
			}
		}
		return resolvedCount;		
	}
};



/* ***************************************************************** */
/*             EVENT HANDLERS                                        */
/* ***************************************************************** */

function initShipToCombobox(){
	var addressesUrl = "./centres-amazon.csv?" + Date.now();
	Papa.parse(addressesUrl,{
		download: true,
		header: true,
		encoding: "iso-8859-1",

		/* bizarre : en mode "download", le mode "step" fait tout planter silencieusement ?!
		...on est donc forcé d'utiliser "complete" pour charger les options */
		complete: function(results){
			var options = $('#shipToCbb').prop('options');
			console.log(results.data[2]);
			results.data.forEach(function(adress){
				var newOption = new Option(adress.NOM);
				newOption.address = adress; // alternative: utiliser des attributs "data-[...]"
				options.add(newOption);
			});
			
			if (options.length == 0)
				GuiMessage.error("Fichier centre amazon vide à l'adresse : "+ addressesUrl);
			else if (!options[0].address.NOM || !options[0].address.L1 || !options[0].address.L2 || !options[0].address.L3 || !options[0].address.L4)
				GuiMessage.error("Fichier centre amazon non-conforme à l'adresse web : "+ addressesUrl);
			else
				options[0].address.isDefault = true; // for validity check
				
			$("#shipToCbb").change(); // async fire change -> init template		
		},
		
		error: function(error, file){
			console.log("Fichier centre amazon Erreur de chargement de la configuration", error);
			GuiMessage.error("Fichier centre amazon Erreur de configuration des centres Amazon à l'adresse : '"+ addressesUrl + "'");
			GuiMessage.error("Fichier centre amazon (Si vous utilisez cette application en mode local, il est possible que votre navigateur ne supporte pas le chargement des fichiers locaux pour des raisons de sécurité)") ;
			// remarque : le chargement de fichier local n'est pas supporté par Chrome... mais Firefox le supporte
		}		
	});
}

var EanList = {};

function initEANList(){
	var addressesUrl = "./ean-amazon.csv?" + Date.now();
	const req = new XMLHttpRequest();
	req.onreadystatechange = function(event) {
		// XMLHttpRequest.DONE === 4
		if (this.readyState === XMLHttpRequest.DONE) {
			if (this.status === 200) {
				var ArrEanLines = req.responseText.split(/\n/);
				var lineNb = 0;
				ArrEanLines.forEach((line) => {
					lineNb++;
					if (lineNb <= 2) {
						return;
					}
					let items = line.split(";");
					for (var i =1; i < 12; i++) {
						if (items[i] && items[i] !== "" ) {
							EanList[""+items[i]] = items[0];
						}
					}
				});
			} else {
				GuiMessage.error("Fichier ean-amazon. Erreur: vérfier que le fichier existe et qu'il est déposé au même endroit que index.html");
			}
		}
	};

	req.open('GET', addressesUrl, true); 
	req.send(null);

}


/* handler Sélection du fichier A (généré sur le site Amazon) */
function handleFileASelect(evt) {	
	// -- Reset rendu
	EntryState.setFieldState("amazon-datafile", false);	
	setAppMode("test");
 	$("#printable-zone #result-zone").empty(); //même en cas d'échec, pour plus de clarté
 	AmzContainers.clear();
 	
 	// -- Lecture fichier sélectionné 	
	var dataCvsFile = evt.target.files[0];	
	if (!dataCvsFile) {
		return; // aucun fichier sélectionné
	}
	EntryState.setFieldState("amazon-datafile");
	//GuiMessage.open();
	GuiMessage.info("Fichier A sélectionné : " + dataCvsFile.name + " ("+  dataCvsFile.size + "o)");
	
	Papa.parse(dataCvsFile, {
		header: false,        // -- Noms de colonnes non-fiables => 1ère ligne à sauter "manuellement"
		dynamicTyping: false, // -- ... certains codes numériques ont des "leading zeroes"
		worker: false,        // -- pour un usage en "site local", les navigateurs considéreraient que "worker : true" violerait la Same Origin Policy
		skipEmptyLines: true, // -- (notamment pour le saut de ligne en fin de fichier)
		encoding: "iso-8859-1",
		
		complete: function(results, file){
			var containerCount = AmzContainers.extractItemRows(results.data);
			if (containerCount < 0) {
				EntryState.setFieldState("amazon-datafile", false);
				return;
			}
			GuiMessage.ok("Étiquettes trouvées : " + containerCount);
			
			var resolvedCount = PalletContent.resolvePalletIds();
			if (resolvedCount>0) {
				GuiMessage.ok("Numéros de palette attribués : " + resolvedCount + " (avec fichier P déjà sélectionné)");
			}
			
			var pageCount = AmzContainers.renderAllStickers();
			GuiMessage.ok("Pages à imprimer : " + pageCount);
			
			EntryState.setFieldState("amazon-datafile", true);
			setAppMode("real");
		},
		error: function(error, file){
			console.log("Error", error);
		}
	});
}

/* handler Sélection du fichier P (version CSV du fichier Excel utilisé au Packaging) */
function handleFilePSelect(evt) {	
	// -- Reset données complémentaires
	EntryState.setFieldState("pallet-datafile", false);
 	PalletContent.clear();
 	
 	// -- Lecture fichier sélectionné 	
	var dataCvsFile = evt.target.files[0];	
	if (!dataCvsFile) {
		AmzContainers.updatePalletNumbers();		
		return; // aucun fichier sélectionné
	}
	EntryState.setFieldState("pallet-datafile");
	//GuiMessage.open();
	GuiMessage.info("Fichier P sélectionné : " + dataCvsFile.name + " ("+  dataCvsFile.size + "o)");
	
	Papa.parse(dataCvsFile, {
		header: false,        // -- Noms de colonnes non-fiables => 1ère ligne à sauter "manuellement"
		dynamicTyping: true,  // -- Pour le coup, on ignore complètement le problème des "leading zeroes", compte tenu du mode de génération de ce fichier-ci
		worker: false,        // -- pour un usage en "site local", les navigateurs considéreraient que "worker : true" violerait la Same Origin Policy
		skipEmptyLines: true, // -- (notamment pour le saut de ligne en fin de fichier)
		encoding: "iso-8859-1",
		
		complete: function(results, file){
			var palletRowCount = PalletContent.captureRows(results.data);
			if (palletRowCount < 0) {
				EntryState.setFieldState("pallet-datafile", false);
				return;
			}
			GuiMessage.info("Fichier P, Nombre d'affectations de palette trouvées : " + palletRowCount); // égal au nombre de lignes ou infér. de 1 (pour le header)
			
			// refaire le rendu si des numéros de palette ont pu être trouvés
			var resolvedCount = PalletContent.resolvePalletIds();
			if (resolvedCount>0) {
				GuiMessage.ok("Numéros de palette attribués : " + resolvedCount);
				
				AmzContainers.updatePalletNumbers();
			}
			
			EntryState.setFieldState("pallet-datafile", true);
		},
		error: function(error, file){
			console.log("Error", error);
		}
	});
}


function handleCbbSelect(evt) {
	var selectedAddress = evt.target.selectedOptions[0].address;
	$(".sticker .shipTo .line1").text(selectedAddress.L1);
	$(".sticker .shipTo .line2").text(selectedAddress.L2);
	$(".sticker .shipTo .line3").text(selectedAddress.L3);
	$(".sticker .shipTo .line4").text(selectedAddress.L4);
	
	EntryState.setFieldState("shipToCbb", !selectedAddress.isDefault);
}

function handleContainerCountOverride(evt) {
	var overrideValue = $("#user-gui #container-count-override").val(); //= evt.target.value;
	var computedValue = $("#user-gui #container-count-original").val(); 
	if (overrideValue){
		$(".sticker .container_count .value").text(overrideValue);
	} else {
		$(".sticker .container_count .value").text(computedValue);
	}
}

function handleASNOverride(evt) {
	EntryState.setFieldState("asn-override");
	
	var overrideValue = $("#user-gui #asn-override").val(); //= evt.target.value;
	if (!overrideValue) overrideValue = "ASNxxxxxxxxxxx";
	$(".sticker").populateStickerBarcode(".asn", overrideValue);
	
	EntryState.setFieldState("asn-override", /ASN[0-9]{1}/.test(overrideValue));
}



/*
arg "mode" parmi : 
	"test" : pas de vraies données, affichage du template
	"real" : vraies données dispo (fichier A), plus besoin du template
	"print" : on cache tout ce qui n'est pas étiquettes
*/	
function setAppMode(mode){
	$("body").removeClass("mode-test mode-real mode-print").addClass("mode-"+mode);
}

$(document).keyup(function(e) {
	if (e.key === "Escape") { // escape key maps to keycode `27`
	$("body").addClass("mode-real").removeClass("mode-print mode-test");
   }
});

$(document).ready(function(){
	// init Interface utilisateur
	GuiMessage.init();
	
	EntryState.clear();
	setAppMode("test");
	$("#amazon-datafile").change(handleFileASelect);
	$("#pallet-datafile").change(handleFilePSelect);
	
	$("#shipToCbb").change(handleCbbSelect);
	initShipToCombobox();
	initEANList();
	
	$("#user-gui #asn-override").change(handleASNOverride);
	$("#container-count-override").change(handleContainerCountOverride);
		
	$("#showCornerBorders").change(function(evt){
		$("#printable-zone").toggleClass("show-corners", $(evt.target).is(":checked"));
	});
	
	
	
	$("#to-print-mode").on("click", function(evt){
		setAppMode("print");
	});	
	$("#printable-zone #result-zone").on("click", function(evt){
		setAppMode("real");
	});
	$("#printable-zone #result-zone").on("click", ".sticker", function(evt){
		evt.stopPropagation(); //prevents bubbling in result (=clones)
	});
	

	// init Template
	var templateLabel = $("#printable-zone #template-zone .sticker");		
	templateLabel.populateStickerBarcode(".asn", "ASNxxxxxxxxxxx");
	templateLabel.populateStickerBarcode(".order_id", "xxxxxxxx");
	templateLabel.populateStickerBarcode(".container_id", "AMZNCC00000000000000");
});