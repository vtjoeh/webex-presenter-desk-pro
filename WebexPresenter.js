/*
WebexPresenterForDeskPro.js  ver 0.15

Note: This Macro needs to be used with the dbWebexPresenter.js file to store variables.  The dbWebexPresenter.js file does not need to be enabled. 

Purpose: Store Immersive Share presets to use during a meeting.  Adjust the pan and scale of the Immersive Share or change the view from Camera PIP, Video PIP or Blend.   
During a **Webex Meeting** take advantage of using PC as a background image.  Also, make your main camera the presentation source.  
This is helpful if the default view for partiicpants is Grid View in Webex. 
Author:  Joe Hughes - joehughe AT Cisco 
*/

import xapi from 'xapi';
import { memObj } from './dbWebexPresenter';
const dbString = "dbWebexPresenter";

let compositionSupported = true; // Is PIP and Video PIP supported?  For CE9.15 this should be set to false.  For RoomOS this can be set to true.  
let mainCam = 1; // Input of Main video Camera
let content = 2; // Input of Content channel 2 = USB-C, 3 is HDMI 
let backgroundModePc;
let foreground = { X: 5000, Y: 5000, Scale: 100, Opacity: 100, Composition: 'Blend' };

const foregroundLimit = { Xmin: 0, Xmax: 10000, Ymin: 0, Ymax: 10000, ScaleMin: 1, ScaleMax: 100, OpacityMin: 0, OpacityMax: 100 };
const timerMoveIncrement = 150;
let timerMove;
let timerPreset;
let activeCalls;

function setBackgroundModePc(content) {
  if (content === 2) {
    backgroundModePc = 'UsbC';
  }
  else if (content === 3) {
    backgroundModePc = 'Hdmi';
  }
}

function updateContent(backgroundModePc) {
  if (backgroundModePc === 'UsbC') {
    content = 2;
  }
  else if (backgroundModePc === 'Hdmi') {
    content = 3;
  }
}

function setDefaultOverlaySourceText(source) {
  xapi.command('UserInterface Extensions Widget SetValue', {
    WidgetId: 'wbxpresent_overlaysource_text',
    Value: source,
  })
}

function setWidgetOpacityText(text) {
  xapi.command('UserInterface Extensions Widget SetValue', {
    WidgetId: 'widget_opacity_text',
    Value: text,
  });
}

function updateMainLayout() {
  xapi.Command.Presentation.Stop();
}

function virtualBackground(x = foreground.X, y = foreground.Y, scale = foreground.Scale, opacity = foreground.Opacity, composition = foreground.Composition) {
  let newForeground;
  xapi.command('Video Input MainVideo Mute');
  if (typeof (x) === 'object') {
    foreground = x;
  } else {
    foreground = { X: x, Y: y, Scale: scale, Opacity: opacity, Composition: composition };
  }
  if (compositionSupported) {
    newForeground = foreground;
  } else {
    newForeground = { X: foreground.X, Y: foreground.Y, Scale: foreground.Scale, Opacity: foreground.Opacity };
  }
  xapi.command('Video Input MainVideo Mute');
  xapi.command('Cameras Background Set', { Mode: backgroundModePc });

  // If the ForegroundParameter Composition parameter throws an error, try again and set compositionSupported = false
  xapi.command('Cameras Background ForegroundParameters Set', newForeground).catch(
    () => {
      compositionSupported = false;
      newForeground = { X: foreground.X, Y: foreground.Y, Scale: foreground.Scale, Opacity: foreground.Opacity };
      xapi.command('Cameras Background ForegroundParameters Set', newForeground);
      console.log('ForegroundParameter Composition feature not yet supported.  Video PIP and PIP will not work. Setting "compositionSupported" to "false"');
    });
  xapi.command("Presentation Start", { ConnectorId: mainCam });
}

xapi.event.on('UserInterface Extensions Widget Action', (event) => {

  if (event.WidgetId === 'wbxpresent_MainCam_Content' && event.Type === 'pressed') {
    xapi.command("Presentation Start", { ConnectorId: content }).then(() => {
      setTimeout(() => {
        xapi.command('Cameras Background Set', { Mode: 'Disabled' });
        xapi.command('Video Input MainVideo Unmute');
      }, 500)
    }); // add a little delay for a smoother transition

  }
  else if (event.WidgetId === 'wbxpresent_Content_MainCam' && event.Type === 'pressed') {
    xapi.command('Video Input MainVideo Mute');
    xapi.command('Cameras Background Set', { Mode: 'Disabled' });
    xapi.command("Presentation Start", { ConnectorId: mainCam });
  }
  else if (event.WidgetId === 'wbxpresent_prominent' && event.Type === 'pressed') {
    xapi.command('Cameras Background Set', { Mode: 'Disabled' });
    xapi.command('Video Input MainVideo Mute');
    xapi.command("Presentation Start", { PresentationSource: [content, mainCam], Layout: 'Prominent' });
  }
  else if (event.WidgetId === 'wbxpresent_equal' && event.Type === 'pressed') {
    xapi.command('Cameras Background Set', { Mode: 'Disabled' });
    xapi.command('Video Input MainVideo Mute');
    xapi.command("Presentation Start", { PresentationSource: [content, mainCam], Layout: 'Equal' });
  }
  else if (event.WidgetId === 'wbxpresent_video_composite' && event.Type === 'pressed') {
    xapi.command('Cameras Background Set', { Mode: 'Disabled' });
    xapi.command('Video Input MainVideo Mute');

    xapi.command("Presentation Start", { PresentationSource: [3, 2, 1], Layout: 'Equal' });
  }
  else if (event.WidgetId === 'wbxpresent_background_mode' && event.Type === 'pressed') {
    if (event.Value === 'UsbC' || event.Value === 'Hdmi') {
      backgroundModePc = event.Value;
      updateContent();
    }
  }
  else if (event.WidgetId === 'wbxpresent_btn_help_background' && event.Type === 'pressed') {
    xapi.command("UserInterface Message Prompt Display", { Title: 'Default Background Override', Text: "When an Immersive Share ends, the selected backgroud will be shown, but you will be unable to disable virtual backgrounds outside of this menu. To turn off virtual backgrounds come here and click 'Disabled'.", 'Option.1': "OK", Duration: 60 });
  }
  else if (event.WidgetId === 'wbxpresent_btn_help_pc_source' && event.Type === 'pressed') {
    xapi.command("UserInterface Message Prompt Display", { Title: 'Default PC Overlay Source', Text: "The macro auto-selects USB-C or HDMI as the virtual background source.  If both are connected, USB-C will be the selected source and the option can be changed here. This setting is reset on restart.", 'Option.1': "OK", Duration: 60 });
  }
  else if (event.WidgetId === 'wbxpresent_virtual_background' && event.Type === 'pressed') {
    xapi.command('UserInterface Extensions Widget UnSetValue', { WidgetId: 'wbxpresent_button_presets' });
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
    }
  }
  else if (event.WidgetId === 'wbxpresent_overlay_usbc' && event.Type === 'pressed') {
    backgroundModePc = 'UsbC';
    updateContent(backgroundModePc);
    virtualBackground();
    setDefaultOverlaySourceText(backgroundModePc);
  }
  else if (event.WidgetId === 'wbxpresent_overlay_hdmi' && event.Type === 'pressed') {
    backgroundModePc = 'Hdmi';
    updateContent(backgroundModePc);
    virtualBackground();
    setDefaultOverlaySourceText(backgroundModePc);
  }
  else if (event.WidgetId === 'wbxpresent_MainCam' && event.Type === 'pressed') {
    resetToDefault();
  }
  else if (event.WidgetId == 'wbxpresent_slider_opacity' && event.Type == 'released') {
    foreground.Opacity = Math.round(event.Value / 255 * 100);
    setWidgetOpacityText(foreground.Opacity);
    virtualBackground();
  }
  else if (event.WidgetId === 'wbxpresent_diagnostics_toggle' && event.Value === 'on') {
    xapi.command('Cameras SpeakerTrack Diagnostics Start');
    xapi.command('Video Input MainVideo Mute');
    xapi.command("Presentation Start", { ConnectorId: mainCam });
  }
  else if (event.WidgetId === 'wbxpresent_diagnostics_toggle' && event.Value === 'off') {
    resetToDefault();
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
  xapi.command('Cameras Background Set', { Mode: 'Disabled' });
  xapi.command('Video Input MainVideo Unmute');
  xapi.command("Presentation Stop").then(
    () => {
      if (activeCalls == 0) {
        xapi.Command.Presentation.Start();
      }
    }
  );

  xapi.command('Cameras SpeakerTrack Diagnostics Stop');
  xapi.command('UserInterface Extensions Widget SetValue', {
    WidgetId: 'wbxpresent_diagnostics_toggle',
    Value: 'off',
  })
  updateMainLayout();
}

function setDefaultGui() {
  xapi.command('UserInterface Extensions Widget SetValue', {
    WidgetId: 'wbxpresent_slider_opacity',
    Value: 255,
  })
  xapi.command('UserInterface Extensions Widget SetValue', {
    WidgetId: 'widget_opacity_text',
    Value: '100',
  })
  xapi.command('UserInterface Extensions Widget SetValue', {
    WidgetId: 'wbxpresent_diagnostics_toggle',
    Value: 'off',
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
    case 'wbxpresent_move:down':
      if (foregroundLimit.Ymax >= foreground.Y + panIncrement) {
        foreground.Y += panIncrement;
      }
      else {
        foreground.Y = foregroundLimit.Ymin;
      }
      break;

    case 'wbxpresent_move:up':
      if (foregroundLimit.Ymin <= foreground.Y - panIncrement) {
        foreground.Y += -panIncrement;
      }
      else {
        foreground.Y = foregroundLimit.Ymax;
      }
      break;

    case 'wbxpresent_move:left':
      if (foregroundLimit.Xmin <= foreground.X - panIncrement) {
        foreground.X += -panIncrement;
      } else {
        foreground.X = foregroundLimit.Xmax;
      }
      break;

    case 'wbxpresent_move:right':
      if (foregroundLimit.Xmax >= foreground.X + panIncrement) {
        foreground.X += +panIncrement;
      } else {
        foreground.X = foregroundLimit.Xmin;
      }
      break;

    case 'wbxpresent_zoom_in':
      if (foregroundLimit.ScaleMax >= foreground.Scale + zoomIncrement) {
        foreground.Scale += zoomIncrement;
      } else {
        foreground.Scale = foregroundLimit.ScaleMax;
      }
      break;

    case 'wbxpresent_zoom_out':
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
  let macro = '// Keep this macro.  Used By \'WebexPresenterForDeskPro.js \' to store variables. \r// This macro does not need to be enabled. \r\rexport let memObj = ' + JSON.stringify(memObj, null, 2);
  xapi.command('Macros Macro Save', { Name: dbString, body: macro });
}

function movePerson(event) {
  let widgetIdMatch = /(wbxpresent_zoom_.+|wbxpresent_move)/
  let compType = /wbxpresent_composition_(.+)/.exec(event.WidgetId);
  function savePreset(event) {
    let index = event.Value - 1;
    memObj.presets[index] = foreground;
    writeToDbMacro();
    xapi.Command.UserInterface.Message.Prompt.Display({ Title: "Preset " + event.Value + " saved ", Text: JSON.stringify(foreground), 'Option.1': 'OK', Duration: 10 });
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
    if (compositionSupported) {
      virtualBackground(foreground.X, foreground.Y, foreground.Scale, foreground.Opacity, compType[1]);
    }
    else {
      let message = "Composition feature to select Blend, PIP or Video PIP not yet supported.  This feature might be avaiable at later date with a Desk Pro software upgrade. ";
      xapi.command("UserInterface Message Prompt Display", { Title: 'Not Supported or Off', "Options.1": "OK", Text: message, Duration: 15 })
    }
  }

  if (event.WidgetId === 'wbxpresent_button_presets' && event.Type === 'released') {
    let index = event.Value - 1;
    xapi.command('UserInterface Extensions Widget UnSetValue', { WidgetId: 'wbxpresent_virtual_background' });
    virtualBackground(memObj.presets[index]);
  }

  if (event.WidgetId === 'wbxpresent_button_presets' && event.Type === 'pressed') {
    timerPreset = setTimeout(savePreset, 1500, event);
  }

  if (event.WidgetId === 'wbxpresent_button_presets' && event.Type === 'released') {
    let index = event.Value - 1;
    clearTimeout(timerPreset);
    virtualBackground(memObj.presets[index]);
  }
}

function determineActiveCalls(newActiveCalls) {
  if ((newActiveCalls == 1 && activeCalls == 0)) {
    resetToDefault();
  } else if (newActiveCalls == 0 && activeCalls == 1) {
    resetToDefault();
    xapi.Command.Presentation.Start();
  }
  activeCalls = newActiveCalls;
}

function openPanel(panel) {
  if (panel.PanelId === 'wbxpresent_cam_content') {
    xapi.Command.UserInterface.Extensions.Panel.Open({ PanelId: 'wbxpresent_cam_content', PageId: 'wbxpresent_panel_main' });
  }
}

setBackgroundModePc(content);

xapi.Status.Video.Input.Connector.on(determineDefaultPCsource);

setDefaultGui();

xapi.Status.SystemUnit.State.NumberOfActiveCalls.get().then(determineActiveCalls);

xapi.Status.SystemUnit.State.NumberOfActiveCalls.on(determineActiveCalls);

xapi.Status.Conference.Presentation.Mode.on(updateDefaultCamera);

xapi.Event.UserInterface.Extensions.Panel.Clicked.on(openPanel);


/*
Warranty & Licensing:
This is sample code.  There is no warranty for this code and no special licensing to use.  Like any custom deployment, it is the responsibility of the partner and/or customer to ensure that the customization works correctly on the device.
*/

