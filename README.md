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