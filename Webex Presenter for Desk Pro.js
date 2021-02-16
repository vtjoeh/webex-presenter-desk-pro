// Webex Presenter for Desk Pro.js 
//
//  Note: This Macro needs to be used with the dbMacro.js file to store variables.  The dbMacro.js file does not need to be enabled. 
// 
// Purpose: Store Immersive Share presets to use during a meeting.  Adjust the pan and scale of the Immersive Share or change the view from Camera PIP, Video PIP or Blend.  
// 
// During a **Webex Meeting** take advantage of using PC as a background image.  Also, make your main camera the presentation source.  
// This is helpful if the default view for partiicpants is Grid View in Webex. 
// Author:  Joe Hughes - joehughe AT Cisco 

import xapi from 'xapi';
import { memObj } from './dbMacro';

let defaultBackgroundMode = 'Disabled' //  Mode: <Disabled, Blur, BlurMonochrome, DepthOfField, Monochrome, Hdmi, UsbC, Image>  - to be used first time and if codec is reset.  Stored in Touch Panel for script restarts. 
let defaultBackgroundImage = 'Image2' // Image:  <Image1, Image2, Image3, Image4, Image5, Image6, Image7, User1, User2, User3>  - to be used first time and if codec or script is reset.  Stored in Touch Panel for script restarts. 

let mainCam = 1; // Input of Main video Camera
let content = 2; // Input of Content channel 2 = USB-C, 3 is HDMI 

let mainSources = [mainCam];
let layoutfamily_main = 'Prominent';  //Equal, Prominent
let foreground = { X: 5000, Y: 5000, Scale: 100, Opacity: 100, Composition: 'Blend' };
let backgroundModePc;

let foregroundLimit = { Xmin: 0, Xmax: 10000, Ymin: 0, Ymax: 10000, ScaleMin: 1, ScaleMax: 100, OpacityMin: 0, OpacityMax: 100 };
let timerMoveIncrement = 150;
let timerMove;
let timerPreset;

function setBackgroundModePc() {
  if (content === 2) {
    backgroundModePc = 'UsbC';
  }
  else if (content === 3) {
    backgroundModePc = 'Hdmi';
  }
}

function setDefaultBackgroundImageText(backgroundImage) {
  xapi.command('UserInterface Extensions Widget SetValue', {
    WidgetId: 'swap_text_default_image',
    Value: backgroundImage,
  });
}

function setDefaultBackgroundModeText(backgroundMode) {
  xapi.command('UserInterface Extensions Widget SetValue', {
    WidgetId: 'swap_text_default_background',
    Value: backgroundMode,
  });

}

function setDefaultOverlaySourceText(source) {
  xapi.command('UserInterface Extensions Widget SetValue', {
    WidgetId: 'swap_overlaysource_text',
    Value: source,
  })
}

function setWidgetOpacityText(text) {
  xapi.command('UserInterface Extensions Widget SetValue', {
    WidgetId: 'widget_opacity_text',
    Value: text,
  });
}

function updateContent(backgroundModePc) {
  if (backgroundModePc === 'UsbC') {
    content = 2;
  }
  else if (backgroundModePc === 'Hdmi') {
    content = 3;
  }
}

function updateMainLayout() {
  xapi.command("Presentation Stop");
  xapi.command('Cameras Background Set', { Mode: defaultBackgroundMode, Image: defaultBackgroundImage });
  xapi.command("Video Input SetMainVideoSource", { ConnectorId: mainSources, Layout: layoutfamily_main });
}

function MainCam_And_Content(primary, secondary) {
  xapi.command("Presentation Start", { ConnectorId: secondary });
  xapi.command("Video Input SetMainVideoSource", { ConnectorId: primary });
}

function virtualBackground(x = foreground.X, y = foreground.Y, scale = foreground.Scale, opacity = foreground.Opacity, composition = foreground.Composition) {
  if (typeof (x) === 'object') {
    foreground = x;
  } else {
    foreground = { X: x, Y: y, Scale: scale, Opacity: opacity, Composition: composition };
  }
  xapi.command('Video Input MainVideo Mute'); 
  xapi.command('Cameras Background Set', { Mode: backgroundModePc });
  xapi.command('Cameras Background ForegroundParameters Set', foreground);
  MainCam_And_Content(content, mainCam);
}

xapi.event.on('UserInterface Extensions Widget Action', (event) => {

  if (event.WidgetId === 'swap_MainCam_Content' && event.Type === 'pressed') {
    xapi.command('Video Input MainVideo Unmute'); 
    xapi.command('Cameras Background Set', { Mode: defaultBackgroundMode, Image: defaultBackgroundImage });
    MainCam_And_Content(mainCam, content);
  }
  else if (event.WidgetId === 'swap_Content_MainCam' && event.Type === 'pressed') {
    xapi.command('Video Input MainVideo Mute'); 
    xapi.command('Cameras Background Set', { Mode: defaultBackgroundMode, Image: defaultBackgroundImage });
    MainCam_And_Content(content, mainCam);
  }
  else if (event.WidgetId === 'swap_prominent' && event.Type === 'pressed') {
    xapi.command('Video Input MainVideo Mute'); 
    xapi.command('Cameras Background Set', { Mode: defaultBackgroundMode, Image: defaultBackgroundImage });
    xapi.command("Video Input SetMainVideoSource", { ConnectorId: [content, mainCam], Layout: 'Prominent' });
    xapi.command("Presentation Start", { PresentationSource: [content, mainCam ], Layout: 'Prominent' });
  }
  else if (event.WidgetId === 'swap_equal' && event.Type === 'pressed') {
    xapi.command('Video Input MainVideo Mute'); 
    xapi.command('Cameras Background Set', { Mode: defaultBackgroundMode, Image: defaultBackgroundImage });
    xapi.command("Video Input SetMainVideoSource", { ConnectorId:[content, mainCam], Layout: 'Equal' });
    xapi.command("Presentation Start", { PresentationSource: [content, mainCam], Layout: 'Equal' });
  }
  else if (event.WidgetId === 'swap_video_composite' && event.Type === 'pressed') {
    xapi.command('Video Input MainVideo Mute'); 
    xapi.command('Cameras Background Set', { Mode: defaultBackgroundMode, Image: defaultBackgroundImage });
    xapi.command("Video Input SetMainVideoSource", { ConnectorId: [3, 2, 1], Layout: 'Equal' });
    xapi.command("Presentation Start", { PresentationSource: [3, 2, 1], Layout: 'Equal' });
  }
  else if (event.WidgetId === 'swap_background_mode' && event.Type === 'pressed') {
    setDefaultBackgroundModeText(event.Value);
    defaultBackgroundMode = event.Value;
    xapi.command('Cameras Background Set', { Mode: defaultBackgroundMode, Image: defaultBackgroundImage });
    if (defaultBackgroundMode === 'UsbC' || defaultBackgroundMode === 'Hdmi') {
      backgroundModePc = defaultBackgroundMode;
      updateContent();
    }
  }
  else if (event.WidgetId === 'swap_virtual_background' && event.Type === 'pressed') {
    switch (event.Value) {
      case 'left':
        virtualBackground(2500, 7500, 50, 100, 'Blend');
        break;
      case 'middle':
        virtualBackground(5000, 7500, 50, 100, 'Blend');
        break;
      case 'right':
        virtualBackground(7500, 7500, 50, 100, 'Blend');
        break;
      case 'upperLeft':
        virtualBackground(1200, 1450, 30, 100, 'Blend');
        break;
      case 'upperRight':
        virtualBackground(9200, 1450, 30, 100, 'Blend');
        break;
      case 'large':
        virtualBackground(5000, 5000, 100, 100, 'Blend');
        break;
      case 'clear':
        xapi.command('Video Input MainVideo Unmute'); 
        MainCam_And_Content(mainCam, content);
        setTimeout(() => { xapi.command('Cameras Background Set', { Mode: defaultBackgroundMode, Image: defaultBackgroundImage }); }, 500);
      default:
      //  do nothing 
    }
  }
  else if (event.WidgetId === 'swap_background_image' && event.Type === 'pressed') {
    xapi.command('Cameras Background Set', { Mode: 'Image', Image: event.Value }).catch(() => (
      xapi.command("UserInterface Message Alert Display", { Text: 'No user image set for ' + event.Value, Duration: 3 })
    ))
  }
  else if (event.WidgetId === 'swap_overlay_usbc' && event.Type === 'pressed') {
    backgroundModePc = 'UsbC';
    updateContent(backgroundModePc);
    virtualBackground();
    setDefaultOverlaySourceText(backgroundModePc);
  }
  else if (event.WidgetId === 'swap_overlay_hdmi' && event.Type === 'pressed') {
    backgroundModePc = 'Hdmi';
    updateContent(backgroundModePc);
    virtualBackground();
    setDefaultOverlaySourceText(backgroundModePc);
  }
  else if (event.WidgetId === 'swap_MainCam' && event.Type === 'pressed') {
    resetToDefault();
  }
  else if (event.WidgetId == 'widget_slider_opacity' && event.Type == 'released') {
    foreground.Opacity = Math.round(event.Value / 255 * 100);
    setWidgetOpacityText(foreground.Opacity);
    virtualBackground();
  }
  else {
    movePerson(event);
  }
});

function updateDefaultCamera(presentationMode) {
  if (presentationMode === 'Receiving') {
    resetToDefault();
  }
}

function resetToDefault() {
  xapi.command('Video Input MainVideo Unmute');
  xapi.command("Presentation Stop");
  mainSources = [mainCam];
  updateMainLayout();
  xapi.Status.Call.get().then((event) => {
    if (event == '') {  // If event == '' then the system is no longer in a call.  Pull up the PC source.  
      xapi.command('Presentation Start');
    }
  });
}

function getConferenceStatus() {
  xapi.Status.Call.get().then((event) => {
    if (event == '') {  // If event == '' then the system is no longer in a call.  Reset to default.  
      resetToDefault();
      xapi.command('Presentation Start');
    }
  });
}

function callDisconnect() {
  setTimeout(getConferenceStatus, 100);
}

function defaultGui() {
  xapi.command('UserInterface Extensions Widget SetValue', {
    WidgetId: 'widget_slider_opacity',
    Value: 255,
  })
  xapi.command('UserInterface Extensions Widget SetValue', {
    WidgetId: 'widget_opacity_text',
    Value: '100',
  })
}

function backgroundImageChange(image) {
  defaultBackgroundImage = image;
  setDefaultBackgroundImageText(image);
}

function backgroundModeChange(mode) {
  if (mode === 'UsbC' || mode === 'Hdmi') {
    // do nothing 
  } else {
    defaultBackgroundMode = mode;
    setDefaultBackgroundModeText(mode);
  }
}

// Some default background image value is stored in the touchpanel 
function getDefaultBackgroundImageTouchPanel() {
  xapi.Status.UserInterface.Extensions.Widget.get().then((widgets) => {
    for (const widget of widgets) {
      if (widget.WidgetId === 'swap_text_default_background') {
        if (widget.Value !== '') {
          defaultBackgroundMode = widget.Value;
        } else {
          xapi.Status.Cameras.Background.Mode.get().then(backgroundModeChange);
        }
      }
      else if (widget.WidgetId === 'swap_overlaysource_text') {
        if (widget.Value !== '') {
          backgroundModePc = widget.Value;
          updateContent(backgroundModePc);
        } else {
          determineDefaultPCsource();
        }
      }
    };
  })
}

// Determine if the USB-C or HDMI is connected when macro starts and set this as the default PC Overlay
function determineDefaultPCsource() {
  xapi.Status.Video.Input.Connector.get().then(connectors => {
    for (const connector of connectors) {
      if ((connector.Type === 'HDMI' || connector.Type === 'USBC-DP') && connector.SignalState === 'OK') {
        if (connector.Type === 'HDMI') {
          backgroundModePc = 'Hdmi';
          content = 3
        }
        if (connector.Type === 'USBC-DP') {
          backgroundModePc = 'UsbC';
          content = 2;
        }
        setDefaultOverlaySourceText(backgroundModePc);
        break;
      }
    }
    setDefaultOverlaySourceText(backgroundModePc);  // if no USB-C or HDMI is connected, set text to default setting 
  });
}

function movePersonTimer(button) {
  updateForeGround(button);
  timerMove = setTimeout(movePersonTimer, timerMoveIncrement, button);
}

function updateForeGround(button) {
  let panIncrement = 50;
  let zoomIncrement = 2;

  switch (button) {
    case 'swap_move:down':
      if (foregroundLimit.Ymax >= foreground.Y + panIncrement) {
        foreground.Y += panIncrement;
      }
      else {
        foreground.Y = foregroundLimit.Ymin;
      }
      break;

    case 'swap_move:up':
      if (foregroundLimit.Ymin <= foreground.Y - panIncrement) {
        foreground.Y += -panIncrement;
      }
      else {
        foreground.Y = foregroundLimit.Ymax;
      }
      break;

    case 'swap_move:left':
      if (foregroundLimit.Xmin <= foreground.X - panIncrement) {
        foreground.X += -panIncrement;
      } else {
        foreground.X = foregroundLimit.Xmax;
      }
      break;

    case 'swap_move:right':
      if (foregroundLimit.Xmax >= foreground.X + panIncrement) {
        foreground.X += +panIncrement;
      } else {
        foreground.X = foregroundLimit.Xmin;
      }
      break;

    case 'swap_zoom_in':
      if (foregroundLimit.ScaleMax >= foreground.Scale + zoomIncrement) {
        foreground.Scale += zoomIncrement;
      } else {
        foreground.Scale = foregroundLimit.ScaleMax;
      }
      break;

    case 'swap_zoom_out':
      if (foregroundLimit.ScaleMin <= foreground.Scale - zoomIncrement) {
        foreground.Scale += -zoomIncrement;
      } else {
        foreground.Scale = foregroundLimit.ScaleMin;
      }
      break;
  }

  virtualBackground(foreground.X, foreground.Y, foreground.Scale, foreground.Opacity, foreground.Composition);

}

function writeToDbMacro() {
  let macro = '// Keep this macro.  Used By \'Webex Presenter for Desk Pro.js\' to store variables. \r// This macro does not need to be enabled. \r\rexport let memObj = ' + JSON.stringify(memObj, null, 2);
  xapi.command('Macros Macro Save', { Name: 'dbMacro', body: macro });
}

function movePerson(event) {  
  let widgetIdMatch = /(swap_zoom_.+|swap_move)/
  let compType = /swap_composition_(.+)/.exec(event.WidgetId);

  function savePreset(event) {
    let index = event.Value - 1;
    memObj.presets[index] = foreground;
    writeToDbMacro();
    xapi.Command.UserInterface.Message.Alert.Display({ Title: "Preset " + event.Value + " saved ", Text: JSON.stringify(foreground), Duration: 10 });
  }

  if (widgetIdMatch.test(event.WidgetId)) {
    let button = event.WidgetId + ((event.Value === '') ? '' : ':' + event.Value);
    if (event.Type === 'released') {
      clearTimeout(timerMove);
    }
    if (event.Type === 'pressed') {
      movePersonTimer(button);
    }
  }

  if (compType != null && event.Type === 'pressed') {
    virtualBackground(foreground.X, foreground.Y, foreground.Scale, foreground.Opacity, compType[1]);
  }

  if (event.WidgetId === 'swap_button_presets' && event.Type === 'released') {
    let index = event.Value - 1;
    virtualBackground(memObj.presets[index]);
  }

  if (event.WidgetId === 'swap_button_presets' && event.Type === 'pressed') {
    timerPreset = setTimeout(savePreset, 3000, event);
  }

  if (event.WidgetId === 'swap_button_presets' && event.Type === 'released') {
    let index = event.Value - 1;
    clearTimeout(timerPreset);
    virtualBackground(memObj.presets[index]);
  }
}

setBackgroundModePc();

determineDefaultPCsource();

getDefaultBackgroundImageTouchPanel(); // In case the macro restarts, grab the setting saved in the touch panel.  

defaultGui(); //

xapi.Status.Cameras.Background.Mode.get().then(backgroundModeChange);

xapi.Status.Cameras.Background.Image.get().then(backgroundImageChange);

xapi.event.on('CallDisconnect', callDisconnect);

xapi.Status.Cameras.Background.Image.on(backgroundImageChange);

xapi.Status.Cameras.Background.Mode.on(backgroundModeChange);

xapi.Status.Conference.Presentation.Mode.on(updateDefaultCamera); // reset the  

/*
Warranty & Licensing:
This is sample code.  There is no warranty for this code and no special licensing to use.  Like any custom deployment, it is the responsibility of the partner and/or customer to ensure that the customization works correctly on the device.
*/

