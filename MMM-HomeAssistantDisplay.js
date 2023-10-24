/* Magic Mirror
 * Module: MMM-HomeAssistantDisplay
 *
 * By Brian Towles <brian@towles.com>
 * MIT Licensed.
 */

Module.register("MMM-HomeAssistantDisplay", {
	result: {},
	defaults: {
		title: "Home Assistant",
		host: "hassio.local",
		port: "8123",
		useTLS: false,
		ignoreCert: true,
		token: "",
		debuglogging: false,
		useModuleTigger: false,
		moduleTriggerTemplate: "",
		moduleTriggerEntities: false,
		animationSpeed: 3000,
		sections: [],
		class: ""
	},
	requiresVersion: "2.1.0", // Required version of MagicMirror
	start: function () {
		var self = this;
		//Flag for check if module is loaded
		this.loaded = false;
		this.displayModule = false;
		this.config.identifier = this.identifier;
		this.sendSocketNotification("CONNECT", this.config);

		// Setup the watched entity for the module display
		if (this.config.useModuleTigger && this.config.moduleTriggerEntities) {
			for (const entity in this.config.moduleTriggerEntities) {
				this.sendSocketNotification("SET_WATCHED_ENTITY", {
					identifier: this.identifier,
					entity: this.config.moduleTriggerEntities[entity]
				});
			}
		} else {
			this.displayModule = true;
		}

		if (this.config.sections) {
			for (const sectioid in this.config.sections) {
				const section = this.config.sections[sectioid];
				for (const entity in section.triggerEntities) {
					this.sendSocketNotification("SET_WATCHED_ENTITY", {
						identifier: this.identifier,
						entity: section.triggerEntities[entity]
					});
				}
				// Set up a timer to trigger re-rendering outside of any entity state update
				if (section.refreshTimer) {
					setInterval(()=> {
						this.renderTemplates("timeout");
						this.updateDom();
					}, section.refreshTimer);
				}
			}
		}
		this.renderTemplates("foo");
		self.updateDom(self.config.animationSpeed);
	},
	isEmpty: function (obj) {
		for (var key in obj) {
			if (obj.hasOwnProperty(key)) {
				return false;
			}
		}
		return true;
	},
	getDom: function () {
		var self = this;
		var wrapper = document.createElement("div");
		if (this.config.class) {
			wrapper.className += this.config.class;
		}

		if (!this.displayModule) {
			this.hide();
			return wrapper;
		}
		this.show();

		for (const section in this.config.sections) {
			if (this.config.sections[section].render) {
				var sectionWrapper = document.createElement("div");
				sectionWrapper.className += " section_" + section;
				if (this.config.sections[section].class) {
					sectionWrapper.className += " " + this.config.sections[section].class;
				}
				sectionWrapper.innerHTML = this.config.sections[section].render;
				wrapper.appendChild(sectionWrapper);
			}
		}
		return wrapper;
	},

	getHeader: function () {
		return this.config.title;
	},

	getScripts: function () {
		return [];
	},

	getStyles: function () {
		return ["modules/MMM-HomeAssistantDisplay/node_modules/@mdi/font/css/materialdesignicons.min.css"];
	},

	// Load translations files
	getTranslations: function () {
		//FIXME: This can be load a one file javascript definition
		return {
			en: "translations/en.json",
			es: "translations/es.json"
		};
	},

	updateState: function (state) {
		if (this.entities.hasOwnProperty(state.entity_id)) {
			this.entities[state.entity_id].updateState(state);
		}
	},

	renderTemplates: function (causingEntity) {
		if (this.config.useModuleTigger && this.config.moduleTriggerTemplate) {
			this.sendSocketNotification("RENDER_MODULE_DISPLAY_TEMPLATE", {
				identifier: this.identifier,
				template: this.config.moduleTriggerTemplate
			});
		}
		for (const sectionId in this.config.sections) {
			this.sendSocketNotification("RENDER_SECTION_DISPLAY_TEMPLATE", {
				identifier: this.identifier,
				section: sectionId,
				template: this.config.sections[sectionId].displayTemplate
			});
		}
	},

	// socketNotificationReceived from helper
	socketNotificationReceived: function (notification, payload) {
		if (payload.identifier === this.identifier) {
			switch (notification) {
			case "MODULE_DISPLAY_RENDERED":
				this.displayModule = payload.render.toLowerCase() === "true" || payload.render.toLowerCase() === "on";
				this.updateDom();
				break;
			case "CHANGED_STATE":
				this.renderTemplates(payload.cause);
				this.updateDom();
				break;
			case "SECTION_DISPLAY_RENDERED":
				this.config.sections[payload.section].render = payload.render;
				this.updateDom();
				break;
			case "HASSWS_DISCONNECTED":
				this.sendSocketNotification("RECONNECT_WS", this.config);
				break;
			default:
				break;
			}
		}
	}
});
