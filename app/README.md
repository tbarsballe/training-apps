# Boundless Training Apps

This repository contains OL3 SDK Apps for replacing GeoExplorer in Boundless training materials.

Project Structure
=================

The core application code is shared between several application configurations. Each app is configured with an app.js file, which determines the inital data set and the included widgets.

```
build.xml   - Ant build script for the project, used to combine the application configuration with the core application code. Applications built thi way are coppied to the build/ directory.
src/
 +- config/ - App configurations for each of the five training apps
 +- lib/   - Core code for the application
```

Building:
=========
Dependancies:
* Apache Ant is required to build
* Boundless Suite SDK is required to generate WAR files.

All build artifacts are placed in the `build/` directory. 

Builds generate an app folder an a war file. The war file can be used in any application server. A geoserver training instance should exist at localhost:8080/geoserver
The app folders can be used in conjunction with `suite-sdk` to run any of the apps in debug mode.

To build everything:

```
ant clean build
```

To build a single app (replace s301_s1_5 with the appropriate identifier):

```
ant build build-s301_s1_5
```

To run any app in debug mode (Will use localhost:9080):

```
cd build
suite-sdk debug build-s301_s1_5
```

