#!/usr/bin/env node

var cli = require("@vimlet/cli").instantiate();
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var commons = require("@vimlet/commons");
var cwd = process.cwd();
var path = require("path");
var readlineSync = require("readline-sync");
var Sync = require("sync");
var fs = require('fs-extra');

var downloadPath = path.join(cwd, "multiServer.zip");
var outputFolder = path.join(cwd, "MultiServer");

cli.flag("i", "install", "Install Multi Server")
    .flag("h", "help", "Display this help")
    .parse(process.argv);

if (Object.keys(cli.result).length == 0 || cli.result.help) {
    cli.printHelp();
} else if (cli.result.install) {
    config();
}

// @function config (private) [Configure installation]
function config() {
    askOutputFolder.sync();
    install();
}

//@function askOutputFolder (private) [Ask user for installation folder]
function askOutputFolder(callback) {
    var askedInput = readlineSync.question("\nDestination folder? (" + outputFolder + ") ").trim();
    if (askedInput != "") {
        fs.ensureDirSync(askedInput);  
        outputFolder = askedInput;
    }
    if (callback) {
        callback(null, outputFolder);
    }
}


//@function install (private) [Install Multi Server to disk]
function install() {
    getLatestVersion(function (err, version) {
        downloadVersion(version, function (err, path) {
            unpack(path, function (err, data) {
                console.log("Multi Server is now installed");
            })
        });
    });
}


//@function unpack (private) [Unpack multiserver and delete temporary data]
function unpack(path, callback) {
    commons.compress.unpack(path, outputFolder, "zip", {
        doneHandler: function () {
            commons.io.deleteFolderRecursiveSync(downloadPath);
            callback();
        }
    });
}


//@function downloadVersion (private) [Download latest version of multiserver to temporary locatiojn]
function downloadVersion(version, callback) {
    var winUrl = "https://github.com/jesusvimlet/multiserver/raw/master/release/MultiServer-" + version + "-win.zip";
    var linuxUrl = "https://github.com/jesusvimlet/multiserver/raw/master/release/multi-server-" + version + ".zip";
    if (commons.os.isLinux()) {
        commons.request.download(linuxUrl, downloadPath, null, function () {
            callback(null, downloadPath);
        });
    } else if (commons.os.isMac()) {
        console.log("Not supported yet");
    } else if (commons.os.isWindows()) {
        commons.request.download(winUrl, downloadPath, null, function () {
            callback(null, downloadPath);
        });
    }
}


// @function getLatestVersion (private) [Get latest multiserver version from GitHub] @param callback
function getLatestVersion(callback) {
    var url = "https://raw.githubusercontent.com/jesusvimlet/multiserver/master/src/node/package.json";
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4) {
            if (this.status == 200) {
                var responseObject = JSON.parse(xhttp.responseText);
                callback(null, responseObject.version);
            } else {
                callback("Request status " + this.status);
            }
        }
    };
    xhttp.open("GET", url, true);
    xhttp.setRequestHeader("User-Agent", "user");
    xhttp.send();
}