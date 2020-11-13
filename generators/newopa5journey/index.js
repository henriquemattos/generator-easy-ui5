const Generator = require("yeoman-generator");
const validFilename = require("valid-filename");
const fs = require("fs");

module.exports = class extends Generator {

  prompting() {
    let aPrompt = [];
    this.options.oneTimeConfig = this.config.getAll();

    if (this.options.isSubgeneratorCall) {
      this.options.oneTimeConfig.projectname = this.options.projectname;
      this.options.oneTimeConfig.namespace = this.options.namespace;
      this.options.oneTimeConfig.modulename = this.options.modulename;
    } else {
      if (!this.config.getAll().viewtype) {
        aPrompt = aPrompt.concat([{
          type: "input",
          name: "projectname",
          message: "Seems like this project has not been generated with Easy-UI5. Please enter the name of your project.",
          validate: (s) => {
            if (/^\d*[a-zA-Z][a-zA-Z0-9]*$/g.test(s)) {
              return true;
            }
            return "Please use alpha numeric characters only for the project name.";
          },
          default: "myUI5App"
        }, {
          type: "input",
          name: "namespace",
          message: "Please enter the namespace you use currently",
          validate: (s) => {
            if (/^[a-zA-Z0-9_\.]*$/g.test(s)) {
              return true;
            }
            return "Please use alpha numeric characters and dots only for the namespace.";
          },
          default: "com.myorg"
        }]);
      }

      const modules = this.config.get("uimodules") || [];
      if (modules.length) {
        aPrompt.push({
          type: "list",
          name: "modulename",
          message: "To which module do you want to add an OPA5 page object?",
          choices: modules,
          when: modules.length
        });
      }
    }

    aPrompt = aPrompt.concat([{
      type: "input",
      name: "journey",
      message: "Journey name:",
      default: "Master",
      validate: validFilename
    }]);

    return this.prompt(aPrompt).then((answers) => {
      for (var key in answers) {
        this.options.oneTimeConfig[key] = answers[key];
      }

      this.options.oneTimeConfig.journey = this.options.oneTimeConfig.journey.charAt(0).toUpperCase() + this.options.oneTimeConfig.journey.substr(1);
      this.options.oneTimeConfig.namespaceURI = this.options.oneTimeConfig.namespace.split(".").join("/");
      this.options.oneTimeConfig.appId = this.options.oneTimeConfig.appId || this.options.oneTimeConfig.namespace + "." + (this.options.oneTimeConfig.modulename || this.options.oneTimeConfig.projectname);
      this.options.oneTimeConfig.appURI = this.options.oneTimeConfig.appURI || this.options.oneTimeConfig.namespaceURI + "/" + (this.options.oneTimeConfig.modulename || this.options.oneTimeConfig.projectname);

      const journeys = this.config.get("opa5Journeys") || [];
      journeys.push(this.options.oneTimeConfig.journey);
      this.config.set("opa5Journeys", journeys);
      this.options.oneTimeConfig.opa5Journeys = journeys;
    });
  }

  async writing() {
    const sModule = this.options.oneTimeConfig.modulename ? this.options.oneTimeConfig.modulename + "/webapp/" : "";

    this.fs.copyTpl(
      this.templatePath("test/integration/$journey.js"),
      this.destinationPath(sModule + "test/integration/" + this.options.oneTimeConfig.journey + "Journey.js"),
      this.options.oneTimeConfig
    );

    // add new journey to AllJourneys list
    const allJourneysFile = this.destinationPath(sModule + "test/integration/AllJourneys.js");
    if (fs.existsSync(allJourneysFile)) {
      const content = fs.readFileSync(allJourneysFile, "utf8").replace(/sap.ui.define\(\[(.*)\]/gms,
        'sap.ui.define\(\[$1  "./' + this.options.oneTimeConfig.journey  + 'Journey"\n]');
      fs.writeFileSync(allJourneysFile, content);
    }
  }
};
