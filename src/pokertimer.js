/* ======================================================
 * PokerTimer 
 *
 * by ReBuildAll
 */
"use strict"

function PokerLevel(smallBlind,bigBlind,ante,duration,isBreak)
{
    if(typeof(smallBlind) === "object") {
        var otherLevel = smallBlind;

        this.smallBlind = otherLevel.smallBlind;
        this.bigBlind = otherLevel.bigBlind;
        this.ante = otherLevel.ante;
        this.duration = otherLevel.duration;
        this.isBreak = otherLevel.isBreak;
    }
    else {
        this.smallBlind = smallBlind || 1;
        this.bigBlind = bigBlind || 2;
        this.ante = ante || 0;
        this.duration = duration || 600;
        this.isBreak = !!isBreak;
    }
}

var pokertimer = angular.module('pokertimer',[]);

pokertimer.filter("place", function() {
    return function(place) {
        var placeString;
        if ( place == 1 ) placeString = "1st";
        else if ( place ==  2 ) placeString = "2nd";
        else if ( place == 3 ) placeString = "3rd";
        else placeString = place + "th";
        return placeString;
    }
});

pokertimer.filter("minutes", function () {
   return function (minutes) {
       var min = (Math.floor(minutes / 60)).toString();
       var sec = (minutes % 60).toString();
       if(min.length<2) { min = "0"+min; }
       if(sec.length<2) { sec = "0"+sec; }
       return min + ":" + sec;
   }
});

pokertimer.directive('scrollIf', function () {
    return function (scope, element, attributes) {
        scope.$watch(attributes.scrollIf, function(newValue,oldValue) {
            if(newValue) {
                var parent = $(element[0]).closest(".scroll-if-parent");
                var target = $(element[0]).closest(".scroll-if-target");
                target.scrollTop( $(element[0]).position().top - parent.position().top );
            }
        });
    }
});

pokertimer.directive("rbaDialog", ["$rootScope", function($rootScope) {

   return {
      link: function(scope,element,attr,controller) {
          $(element).click(function() {
              $rootScope.$broadcast("showDialog", {id: attr["rbaDialog"]});
              dialogManager.showDialog(attr["rbaDialog"]);
          })
      }
   };
}]);

pokertimer.factory("settings", ["$rootScope", function($rootScope) {
    var settingsInstance = {
        settings: [],
        config: {
            currentPreset: 0
        },

        init: function() {
            this.settings = window.localStorage.getItem("RBAPokerTimer_Presets");
            this.config = window.localStorage.getItem("RBAPokerTimer_Configuration");
            if(!this.settings) {
                this.reset();
            }
            else {
                this.settings = JSON.parse(this.settings);
                this.config = JSON.parse(this.config);
                if ( !this.config ) {
                    this.config = {
                        currentPreset: 0
                    };
                }
            }

            var that = this;

            $rootScope.$on("settingsUpdated", function() {
                that.save();
                $rootScope.$broadcast("reload");
            });
        },

        get: function() {
            return this.settings[this.config.currentPreset];
        },

        newPreset: function() {
            var preset = angular.copy(this.settings[this.config.currentPreset]);
            preset.name = "Preset " + new Date().toLocaleDateString();
            this.settings.push(preset);
            this.save();
        },

        removePreset: function(index) {
            if(this.config.currentPreset >= index ) {
                this.config.currentPreset--;
            }
            this.settings.splice(index,1);
            this.save();
        },

        changePreset: function(index) {
            this.config.currentPreset = index;
            this.save();
        },

        reset: function() {
            window.localStorage.removeItem("RBAPokerTimer_Presets");
            window.localStorage.removeItem("RBAPokerTimer_Configuration");

            this.settings = [
                    {
                        name: "Chips 400 / 6+ players / 10€ buyin",
                        levels: this.defaultLevels_400bi_min6(),
                        prizeSharing: [50, 30, 20],
                        buyinCost: 10,
                        buyinChips: 400,
                        addonChips: 400,
                        addonCost: 10,
                        rebuyChips: 400,
                        rebuyCost: 10,
                        currency: "€"
                    },
                    {
                        name: "Chips 400 / 4-5 players / 5€ buyin",
                        levels: this.defaultLevels_400bi_max5(),
                        prizeSharing: [60, 40],
                        buyinCost: 5,
                        buyinChips: 400,
                        addonChips: 400,
                        addonCost: 10,
                        rebuyChips: 400,
                        rebuyCost: 10,
                        currency: "€"
                    }];
            this.config = {
                currentPreset: 0
            };

            var legacy = this.tryReadLegacySettings();
            if(legacy) {
                this.settings.push(legacy);
            }

            this.save();
        },

        defaultLevels_400bi_min6: function() {
            return [
                new PokerLevel(2,4),
                new PokerLevel(4,8),
                new PokerLevel(5,10),
                new PokerLevel(10,20),
                new PokerLevel(20,40),
                new PokerLevel(30,60),
                new PokerLevel(0,0,0,600,true),
                new PokerLevel(50,100),
                new PokerLevel(75,150),
                new PokerLevel(100,200),
                new PokerLevel(125,250),
                new PokerLevel(150,300),
                new PokerLevel(200,400),
                new PokerLevel(250,500),
                new PokerLevel(300,600),
                new PokerLevel(300,600,50),
                new PokerLevel(300,600,100),
                new PokerLevel(300,600,200),
                new PokerLevel(300,600,300)
            ];
        },

        defaultLevels_400bi_max5: function() {
            return [
                new PokerLevel(2,4),
                new PokerLevel(4,8),
                new PokerLevel(5,10),
                new PokerLevel(10,20),
                new PokerLevel(20,40),
                new PokerLevel(30,60),
                new PokerLevel(0,0,0,600,true),
                new PokerLevel(50,100),
                new PokerLevel(75,150,10),
                new PokerLevel(100,200,20),
                new PokerLevel(125,250,20),
                new PokerLevel(150,300,50),
                new PokerLevel(200,400,50),
                new PokerLevel(250,500,50),
                new PokerLevel(300,600,100),
                new PokerLevel(300,600,100),
                new PokerLevel(300,600,100),
                new PokerLevel(300,600,200),
                new PokerLevel(300,600,300)
            ];
        },

        tryReadLegacySettings: function() {
            var legacy = {
                name: "Settings from v0.3",
                levels: this.defaultLevels_400bi_min6(),
                prizeSharing: [50,30,20],
                buyinCost: 10,
                buyinChips: 400,
                addonChips: 400,
                addonCost: 10,
                rebuyChips: 400,
                rebuyCost: 10,
                currency: "€"
            };

            var hasLegacy = false;
            var levels = window.localStorage.getItem("LennuPokerTimer_Levels");
            if(levels) {
                legacy.levels = levels;
                hasLegacy = true;
            }

            var settings = window.localStorage.getItem("LennuPokerTimer_Settings");
            if (settings) {
                var settingsValues = JSON.parse(settings);
                hasLegacy = true;

                legacy.buyinCost = settingsValues.buyinCost;
                legacy.buyinChips = settingsValues.buyinChips;
                legacy.addonChips = settingsValues.addonChips;
                legacy.addonCost = settingsValues.addonCost;
                legacy.rebuyChips = settingsValues.rebuyChips;
                legacy.rebuyCost = settingsValues.rebuyCost;
            }

            var prize = window.localStorage.getItem("LennuPokerTimer_Prize");
            if (prize) {
                var prizeValues = JSON.parse(prize);
                hasLegacy = true;

                legacy.prizeSharing = prizeValues.sharing;
            }

            return hasLegacy ? legacy : undefined;
        },

        save: function() {
            window.localStorage.setItem("RBAPokerTimer_Presets", JSON.stringify(this.settings));
            window.localStorage.setItem("RBAPokerTimer_Configuration", JSON.stringify(this.config));
        },

        export: function(index) {
            return angular.toJson(this.settings[index]);
        },

        import: function(settingsString) {
            this.settings.push(JSON.parse(settingsString));
            this.save();
        }
    };

    settingsInstance.init();

    return settingsInstance;
}]);

pokertimer.factory("poker", ["$rootScope", "$interval", "settings", "sfx", function($rootScope, $interval, settings, sfx) {
    var pokerInstance = {
        isRunning: false,
        intervalId: undefined,
        lastStart: undefined,
        alreadyElapsed: 0,

        isLevelActive: false,

        currentLevel: 0,

        isInProgress : function() {
            return this.isRunning || this.alreadyElapsed>0 || this.currentLevel>0;
        },

        gotoNextLevel: function() {
            if ( this.currentLevel < settings.get().levels.length - 1 ) {
                this.currentLevel++;
            }

            this.isLevelActive = true;
            this.alreadyElapsed = 0;
            this.lastStart = new Date();

            $rootScope.$broadcast("nextlevel");
            this.updateTime();
        },

        updateTime: function() {
            var levelTime = settings.get().levels[this.currentLevel].duration;

            var time = this.getElapsedTime();
            var remaining = levelTime - time;

            var remainingPercent = remaining / levelTime * 100;
            var elapsedPercent = 100 - remainingPercent;

            var remainingMinutes = Math.floor(Math.round(remaining) / 60);
            var remainingSeconds = Math.floor(Math.round(remaining) % 60);

            $rootScope.$broadcast("updatetime", {
                elapsedPercent: elapsedPercent,
                remainingMinutes: remainingMinutes,
                remainingSeconds: remainingSeconds
            });

            return remaining;
        },

        getElapsedTime: function(returnOnlyThisPeriod) {
            if ( !this.isRunning ) { return this.alreadyElapsed; }

            var timeNow = new Date();
            var elapsed = (timeNow - this.lastStart) / 1000;

            if ( returnOnlyThisPeriod ) {
                return elapsed;
            }
            else {
                return elapsed + this.alreadyElapsed;
            }
        },

        tick: function() {
            var remainingSeconds = this.updateTime();

            if ( remainingSeconds < 60 ) {
                sfx.startWarning();
            }

            if ( remainingSeconds < 0.1 && this.isLevelActive ) {
                this.isLevelActive = false;
                this.gotoNextLevel();
            }
        },

        start: function() {
            if ( this.isRunning ) {
                return;
            }

            this.isRunning = true;

            this.lastStart = new Date();

            this.updateTime();

            this.isLevelActive = true;

            var pokerService = this;
            this.intervalId = $interval(function() {
                pokerService.tick();
            }, 1000 );
        },

        stop: function() {
            if ( !this.isRunning )
            {
                return;
            }

            this.alreadyElapsed += this.getElapsedTime(true);

            $interval.cancel(this.intervalId);
            this.intervalId = undefined;

            this.isRunning = false;
        },

        reset: function() {
            this.currentLevel = 0;
            this.alreadyElapsed = 0;
            $rootScope.$broadcast("reset");
            this.updateTime();
            $rootScope.$broadcast("nextlevel");
        }
    };

    return pokerInstance;
}]);

pokertimer.factory("sfx", [function() {
    var sfxInstance = {
        isWarningActive: false,

        stopWarning: function() {
            if ( this.isWarningActive ) {
                this.pauseAudio("#audio-minute");
                this.isWarningActive = false;
            }
        },

        startWarning: function() {
            if ( !this.isWarningActive ) {
                this.isWarningActive = true;
                this.playAudio("#audio-minute", false);
            }
        },

        startLevel: function () {
            this.playAudio("#audio-level");
        },

        playAudio: function(id,loop) {
            var a = $(id)[0];
            if ( a.pause ) {
                a.pause();
            }
            if ( loop ) {
                a.loop = true;
            }
            a.currentTime = 0;
            a.play();
        },

        pauseAudio: function(id) {
            var a = $(id)[0];
            if ( a.pause ) {
                a.pause();
            }
        }
    };

    return sfxInstance;
}]);

pokertimer.controller("tournament", ["$scope", "$window", "settings", "poker", function($scope, $window, settings, poker){
    $scope.players = 2;
    $scope.activePlayers = 2;
    $scope.addons = 0;
    $scope.rebuys = 0;

    $scope.settings = settings.get();

    $scope.totalChips = function() {
        return $scope.players * $scope.settings.buyinChips +
            $scope.addons * $scope.settings.addonChips +
            $scope.rebuys * $scope.settings.rebuyChips;
    }

    $scope.averageChips = function() {
        return Math.round($scope.totalChips() / $scope.activePlayers);
    }

    $scope.totalPrizes = function() {
        return $scope.players * $scope.settings.buyinCost +
            $scope.addons * $scope.settings.addonCost +
            $scope.rebuys * $scope.settings.rebuyCost;
    }

    $scope.onBuyIn = function() {
        $scope.players++;
        $scope.activePlayers++;
    }

    $scope.onPlayerOut = function() {
        $scope.activePlayers--;
    }

    $scope.removePlayer = function() {
        $scope.players--;
        $scope.activePlayers--;
    }

    $scope.addRebuy = function () {
        $scope.rebuys++;
    }

    $scope.removeRebuy = function() {
        $scope.rebuys--;
    }

    $scope.addAddOn = function() {
        $scope.addons++;
    }

    $scope.removeAddOn = function() {
        $scope.addons--;
    }

    $scope.$on("reset",function() {
        $scope.settings = settings.get();
        $scope.activePlayers = $scope.players;
        $scope.addons = 0;
        $scope.rebuys = 0;
    });

    $window.onbeforeunload = function() {
        if(poker.isInProgress()) {
            return "Tournament is in progress, are you sure you wish to abandon it?";
        }
    }
}]);

pokertimer.controller("gamestatus",
    ["$scope", "poker", "settings", "sfx",
        function($scope,poker,settings,sfx) {

    $scope.getCurrentLevel = function() {
        return settings.get().levels[poker.currentLevel];
    }
    $scope.getNextLevel = function() {
        if(poker.currentLevel == settings.get().levels.length - 1) {
            return settings.get().levels[poker.currentLevel + 1];
        }
        return settings.get().levels[poker.currentLevel + 1];
    }

    $scope.levels = settings.get().levels;
    $scope.currentLevelIndex = poker.currentLevel;

    $scope.$on("nextlevel", function() {
        $scope.currentLevelIndex = poker.currentLevel;
    });

    $scope.$on("updatetime", function(e,a) {
        function zeroPad(num, places) {
            var zero = places - num.toString().length + 1;
            return Array(+(zero > 0 && zero)).join("0") + num;
        };
        $("#poker-progress-full").css("width", a.elapsedPercent+"%");
        $("#poker-time").text(zeroPad(a.remainingMinutes,2) + ":" + zeroPad(a.remainingSeconds,2));
    });

    $scope.$on("reload", function() {
        $scope.levels = settings.get().levels;
        $scope.currentLevelIndex = poker.currentLevel;
    });

    $scope.gotoNextLevel = function () {
        sfx.stopWarning();
        sfx.startLevel();

        poker.gotoNextLevel();
    }

    $scope.start = function() {
        poker.start();
    }

    $scope.stop = function() {
        poker.stop();
    }

    $scope.reset = function() {
        if (confirm("This will reset the current tournament and restart it. Are you sure you wish to abandon your current game?")) {
            poker.stop();
            poker.reset();
        }
    }

    $scope.isRunning = function() {
        return poker.isRunning;
    }

    poker.updateTime();
}]);

pokertimer.controller("setup", ["$scope", "poker", "settings", function($scope,poker,settings) {
    $scope.levels = [];

    $scope.editableSettings = {};

    $scope.prizes = [];

    $scope.allSettings = settings.settings;

    $scope.configuration = settings.config;

    $scope.exportImport = {
        exporting: false,
        importing: false,
        exportValue: "",
        importValue: ""
    };

    function levels_copy ( source, dest ) {
        dest.splice(0,dest.length);
        for(var i = 0; i < source.length; ++i) {
            dest.push(new PokerLevel(source[i]));
        }
    }

    function reloadPresets() {
        $scope.allSettings = settings.settings;
        $scope.configuration = settings.config;
        $scope.$apply();
    }

    function reloadLevels() {
        levels_copy ( settings.get().levels, $scope.levels );
        $scope.$apply();
    }

    function reloadSettings() {
        $scope.editableSettings = {
            buyinChips: settings.get().buyinChips,
            buyinCost: settings.get().buyinCost,
            rebuyChips: settings.get().rebuyChips,
            rebuyCost: settings.get().rebuyCost,
            addonChips: settings.get().addonChips,
            addonCost: settings.get().addonCost
        };
        $scope.$apply();
    }

    function reloadPrizes() {
        $scope.prizes.splice(0,$scope.prizes.length);
        var prizeSharing = settings.get().prizeSharing;
        for(var i = 0; i < prizeSharing.length; ++i ) {
            $scope.prizes.push ({val: prizeSharing[i]});
        }
        $scope.$apply();
    }

    $scope.$on("showDialog", function(e,a){
        if(a.id == "#dialog-level-structure") {
            reloadLevels();
        }
        if(a.id == "#dialog-prize-structure") {
            reloadPrizes();
        }
        if(a.id == "#dialog-parameters") {
            reloadSettings();
        }
        if(a.id == "#dialog-preset") {
            reloadPresets();
        }
    });

    $scope.removeLevel = function (index) {
        $scope.levels.splice(index,1);
        $scope.$apply();
    };

    $scope.addLevel = function () {
        var lastLevel = $scope.levels[$scope.levels.length -1];
        $scope.levels.push(new PokerLevel(lastLevel.smallBlind, lastLevel.bigBlind, lastLevel.ante, lastLevel.duration));
    };

    $scope.removePrize = function (index) {
        $scope.prizes.splice(index,1);
        $scope.$apply();
    };

    $scope.addPrize = function () {
        $scope.prizes.push({val: 0});
    };

    $scope.prizesSum = function(p) {
        var sum = 0;
        for(var i = 0; i < p.length; ++i ) {
            sum += parseInt(p[i].val);
        }
        return sum;
    }

    $scope.saveLevelStructure = function () {
        levels_copy ( $scope.levels, settings.get().levels );
        $scope.$emit("settingsUpdated");
    };

    $scope.saveSettings = function () {
        settings.get().buyinChips = $scope.editableSettings.buyinChips;
        settings.get().buyinCost = $scope.editableSettings.buyinCost;
        settings.get().rebuyChips = $scope.editableSettings.rebuyChips;
        settings.get().rebuyCost = $scope.editableSettings.rebuyCost;
        settings.get().addonChips = $scope.editableSettings.addonChips;
        settings.get().addonCost = $scope.editableSettings.addonCost;
        $scope.$emit("settingsUpdated");
    };

    $scope.savePrizes = function () {
        settings.get().prizeSharing.splice(0,settings.get().prizeSharing.length);
        var prizeSharing = $scope.prizes;
        for(var i = 0; i < prizeSharing.length; ++i ) {
            settings.get().prizeSharing.push (prizeSharing[i].val);
        }
        $scope.$emit("settingsUpdated");
    };

    $scope.resetAllSettings = function() {
        if(confirm("This will OVERWRITE all current settings with the default ones, erasing EVERYTHING. The operation CANNOT BE undone.\n\nAre you absolutely sure?")) {
            settings.reset();
            $scope.$emit("settingsUpdated");
            poker.stop();
            poker.reset();
        }
    };


    $scope.resetLevels = function() {
        if(confirm("This will RESET the level settings for the current preset to the default ones. Your current level settings will be lost.\n\nContinue?")) {
            settings.get().levels = settings.defaultLevels_400bi_min6();
            $scope.$emit("settingsUpdated");
            poker.stop();
            poker.reset();
        }
    };

    function noExportImport() {
        $scope.exportImport.exporting = false;
        $scope.exportImport.importing = false;
    }

    $scope.newPreset = function() {
        noExportImport();
        settings.newPreset();
    };

    $scope.selectPreset = function(index) {
        noExportImport();
        if(confirm("This will change the preset but also RESET everything.\n\nContinue?")) {
            settings.changePreset(index);
            $scope.$emit("settingsUpdated");
            poker.stop();
            poker.reset();
        }
    };

    $scope.deletePreset = function(index) {
        noExportImport();
        if(confirm("This will remove the preset and also RESET everything. No going back.\n\nContinue?")) {
            settings.removePreset(index);
            $scope.$emit("settingsUpdated");
            poker.stop();
            poker.reset();
        }
    };

    $scope.exportPreset = function(index) {
        var exportable = settings.export(index);
        noExportImport();
        $scope.exportImport.exporting = true;
        $scope.exportImport.exportValue = exportable;
    };

    $scope.importPreset = function() {
        noExportImport();
        $scope.exportImport.importing = true;
        $scope.exportImport.importValue = "";
    };

    $scope.importSave = function() {
        var presetJson = $scope.exportImport.importValue;

        noExportImport();

        if ( presetJson == "" ) {
            return;
        }

        settings.import(presetJson);
        $scope.$emit("settingsUpdated");
    };

    $scope.savePresets = function() {
        settings.save();
    };

}]);

var dialogManager = {
    showDialog: function(selector) {
        var dialog = $(selector);

        this.initDialog(dialog);

        $(".dialog").show();
        dialog.slideDown();
        var controls = dialog.find("input");
        if(controls.length>0) { controls[0].focus(); }
    },

    initDialog: function(dialog) {
        var that = this;
        dialog.find(".controls-save").off("click.rbadialog").on("click.rbadialog", function() {
            that.closeDialog(dialog);
        });
        dialog.find(".controls-cancel").off("click.rbadialog").on("click.rbadialog", function() {
            that.closeDialog(dialog);
        });

        $(window).off("keyup.rbadialog").on("keyup.rbadialog", function(e) {
            if(e.which == 27) {
                that.closeDialog(dialog);
            }
        });
    },

    closeDialog: function(dialog) {
        dialog.fadeOut();
        $(".dialog").fadeOut();
    }
};

/*
 * Update notification
 */
$(function() {
    $("#update-notification-dismiss").click(function(){ 
        $("#update-notification").hide();
        return false;
    });
    
    if ( window.applicationCache ) {
        window.applicationCache.addEventListener("updateready",function() {
            $("#update-notification").show();
        },false);
    }
});
