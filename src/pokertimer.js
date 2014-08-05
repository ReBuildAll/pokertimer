/* ======================================================
 * PokerTimer 
 *
 * by ReBuildAll
 */
function PokerLevel(smallBlind,bigBlind,ante,duration,isBreak)
{
    this.smallBlind = smallBlind || 1;
    this.bigBlind = bigBlind || 2;
    this.ante = ante || 0;
    this.duration = duration || 600;
    this.isBreak = !!isBreak;
}

var pokertimer = angular.module('pokertimer',[]);

pokertimer.filter("place", function() {
    return function(place) {
        if ( place == 1 ) placeString = "1st";
        else if ( place ==  2 ) placeString = "2nd";
        else if ( place == 3 ) placeString = "3rd";
        else placeString = place + "th";
        return placeString;
    }
});

pokertimer.directive('scrollIf', function () {
    return function (scope, element, attributes) {
        scope.$watch(attributes.scrollIf, function(newValue,oldValue) {
            if(newValue) {
                element[0].scrollIntoView();
            }
        });
    }
});

pokertimer.directive("rbaDialog", function() {

   return {
      link: function(scope,element,attr,controller) {
          $(element).click(function() {
              alert("boo");
          })
      }
   };
});

pokertimer.factory("settings", [function() {
    var settingsInstance = {
        settings: [],
        currentSettings: 0,

        init: function() {
            this.settings = window.localStorage.getItem("RBAPokerTimer_Settings");
            if(!this.settings) {
                this.reset();
            }
            else {
                this.settings = JSON.parse(this.settings);
            }
        },

        get: function() {
            return this.settings[this.currentSettings];
        },

        reset: function() {
            window.localStorage.removeItem("RBAPokerTimer_Settings");

            var defaultSettings = {
                name: "RBA Home Tournament",
                levels: this.defaultLevels(),
                prizeSharing: [50,30,20],
                buyinCost: 10,
                buyinChips: 400,
                addonChips: 400,
                addonCost: 10,
                rebuyChips: 400,
                rebuyCost: 10,
                currency: "€"
            };

            this.settings = [defaultSettings];

            var legacy = this.tryReadLegacySettings();
            if(legacy) {
                this.settings.push(legacy);
            }

            this.save();
        },

        defaultLevels: function() {
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

        tryReadLegacySettings: function() {
            var legacy = {
                name: "Settings from v0.3",
                levels: this.defaultLevels(),
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
            window.localStorage.setItem("RBAPokerTimer_Settings", JSON.stringify(this.settings));
        },

        export: function(index) {
            return JSON.stringify(this.settings[index]);
        },

        import: function(settingsString) {

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

            pokerService = this;
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
        $scope.activePlayers = $scope.players;
        $scope.addins = 0;
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
}]);

var dialogManager = {
    showDialog: function(selector) {
        var dialog = $(selector);
        
        if ( dialog.attr("id")=="dialog-prize-structure") {
            this.initPrizeStructure();
        }
        else if ( dialog.attr("id")=="dialog-level-structure") {
            this.initLevelStructure();
        }
        else if ( dialog.attr("id")=="dialog-parameters") {
            this.initParameters();
        }
        
        $(".dialog").show();
        dialog.slideDown();
        dialog.find("input")[0].focus();
    },
    
    buildDynamicTable: function(dataObject, containerSelector, columns, createRowFunc) {
        $(containerSelector).html("");
        
        var index = 0;
        for(var itemIndex in dataObject) {
            var removeButton = "<span class='controls-remove'>remove</span>";            
            if (index == 0) { removeButton = ""; }

            var dataRow = createRowFunc ( dataObject[itemIndex] );
            
            var alternate = "";
            if ( index % 2 == 0 ) alternate = " class='alternaterow'";
            index++;
            
            var uiRow = "<tr" + alternate + ">";
            
            for ( var c = 0; c < columns; ++c ) {
                var css = "";
                if ( dataRow[c].css ) {
                    css = " class='"+dataRow[c].css+"'";
                }
                uiRow += "<td><input"+css+" type='text' maxlength='9' value='"+dataRow[c].value+"'/></td>";
            }
            uiRow += "<td>"+removeButton+"</td></tr>";
            
            $(uiRow).appendTo(containerSelector);
        }

        {        
            var alternate = "";
            if ( index % 2 == 0 ) alternate = " class='alternaterow'";

            var addRow = "<tr"+alternate+">";
            for( var c = 0; c < columns; ++c ) {
                addRow += "<td>&nbsp;</td>";
            }
            addRow += "<td><span class='controls-add'>add</span></td></tr>";
            $(addRow).appendTo(containerSelector);
        }
        
        this.registerAddRemove(containerSelector);
    },
    
    initPrizeStructure: function() {
        this.buildDynamicTable(tournamentManager.prize.sharing,"#dialog-prize-structure .widget-table tbody",1,function(dataItem) {
            return [{value: dataItem}];
        });
    },

    initLevelStructure: function() {
        this.buildDynamicTable(pokerTimer.levels, "#dialog-level-structure .widget-table tbody", 4, function(dataItem) {
            return [{css: "setup-input-smallblind", value: dataItem.smallBlind},
                    {css: "setup-input-bigblind", value: dataItem.bigBlind},
                    {css: "setup-input-ante", value: dataItem.ante},
                    {css: "setup-input-duration", value: dataItem.duration}];            
        });
    },
    
    savePrizeStructure: function() {
        var sharesUI = $("#dialog-prize-structure .widget-table tbody .setup-input-share");
        var shares = [];
        
        for(var i = 0; i < sharesUI.length; ++i ) {
            shares.push(this.parseInteger(sharesUI[i].value));
        }
        
        tournamentManager.prize.sharing = shares;
        
        tournamentManager.savePrize();
        tournamentManager.updateUI();
        
        return true;
    },
    
    saveLevelStructure: function() {
        var levelsUI = $("#dialog-level-structure .widget-table tbody tr");
        var levels = [];
        
        for(var i = 0; i < levelsUI.length - 1; ++i ) {
            var smallblind = this.parseInteger($(levelsUI[i]).find(".setup-input-smallblind").val(),-1);
            var bigblind  = this.parseInteger($(levelsUI[i]).find(".setup-input-bigblind").val(),-1);
            var ante = this.parseInteger($(levelsUI[i]).find(".setup-input-ante").val(),-1);
            var duration = this.parseInteger($(levelsUI[i]).find(".setup-input-duration").val(),-1);
            
            if ( smallblind < 0 || bigblind < 0 || ante < 0 || duration < 0 ) return false;
            
            if ( duration < 60 ) {
                duration = 60;
            }
            
            var level = new PokerLevel( smallblind, bigblind, ante, duration );
            levels.push(level);
        }
        
        pokerTimer.levels = levels;
        
        pokerTimer.saveLevels();
        pokerTimer.refreshLevels();
        pokerTimer.refreshBlinds();
        pokerTimer.updateTime();
        
        return true;
    },
    
    initParameters: function() {
        $("#setup-buyin").val(tournamentManager.settings.buyinCost);
        $("#setup-buyin-chips").val(tournamentManager.settings.buyinChips);
        $("#setup-rebuy").val(tournamentManager.settings.rebuyCost);
        $("#setup-rebuy-chips").val(tournamentManager.settings.rebuyChips);
        $("#setup-addon").val(tournamentManager.settings.addonCost);
        $("#setup-addon-chips").val(tournamentManager.settings.addonChips);
    },
    
    saveParameters: function() {
        tournamentManager.settings.buyinCost = this.parseInputInteger("#setup-buyin",10);
        tournamentManager.settings.buyinChips = this.parseInputInteger("#setup-buyin-chips",400);
        tournamentManager.settings.rebuyCost = this.parseInputInteger("#setup-rebuy",10);
        tournamentManager.settings.rebuyChips = this.parseInputInteger("#setup-rebuy-chips",400);
        tournamentManager.settings.addonCost = this.parseInputInteger("#setup-addon",10);
        tournamentManager.settings.addonChips = this.parseInputInteger("#setup-addon-chips",400);
 
        tournamentManager.saveSettings();
        tournamentManager.updateUI();
        
        return true;
    },
    
    parseInputInteger: function(selector,def) {
        var val = $(selector).val();
        return this.parseInteger(val,def);
    },

    parseInteger: function(val,def) {
        var par = parseInt(val);
        if ( isNaN(par) ) { return def; }
        else return par;
    },
    
    registerAddRemove: function(selector) {
        $(selector).find(".controls-remove").click(function() {
            $(this).parents("tr").remove();
        });
        $(selector).find(".controls-add").click(function() {
            var template = $(this).parents("tbody").find("tr:first-child").clone();
            template.find("td:last-child").html("<span class='controls-remove'>remove</span>");
            template.find(".controls-remove").click(function() {
                $(this).parents("tr").remove();
            });
            $(this).parents("tr").before(template);
        });
    },
    
    register: function() {
        var instance = this;
        $(".dialog, .dialog-box").hide();
       
        $(".controls-cancel").click(function() {
            $(".dialog, .dialog-box").fadeOut();
        });
        $(".controls-save").click(function() {
            var div = $(this).parents(".dialog-box");
            if ( div.length == 0 ) return;
            
            var id = div.attr("id");
            
            var res = true;
            if ( id == "dialog-parameters" ) {
                res = instance.saveParameters();
            }
            else if ( id == "dialog-prize-structure" ) {
                res = instance.savePrizeStructure();
            }
            else if ( id == "dialog-level-structure" ) {
                res = instance.saveLevelStructure();
            }
            
            if ( res ) {
                $(".dialog, .dialog-box").hide();
            }
        });
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
