// Webex Presenter for Desk Pro 
//
// During a **Webex Meeting** take advantage of using PC as a background image.  Also, make your main camera the presentation source.  
// This is helpful if the default view for partiicpants is Grid View in Webex. 
// Author:  Joe Hughes --- reach by e-mail at: joehughe at cisco . com 

import xapi from 'xapi';

let defaultBackgroundMode = 'Disabled' //  Mode: <Disabled, Blur, BlurMonochrome, DepthOfField, Monochrome, Hdmi, UsbC, Image>  - to be used first time and if codec or script is reset. 
let defaultBackgroundImage = 'Image2' // Image:  <Image1, Image2, Image3, Image4, Image5, Image6, Image7, User1, User2, User3>  - to be used first time and if codec or script is reset.  Only used if background is an image

let mainCam = 1; // Input of Main video Camera
let content = 2; // Input of Content channel 2 = USB-C, 3 is HDMI 

let mainSources = [mainCam];
let layoutfamily_main = 'Prominent';  //Equal, Prominent
let foreground = { X: 5000, Y: 5000, Scale: 100, Opacity: 100 };
let backgroundModePc;

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

function virtualBackground(x = foreground.X, y = foreground.Y, scale = foreground.Scale, opacity = foreground.Opacity) {
    foreground = { X: x, Y: y, Scale: scale, Opacity: opacity };
    xapi.command('Cameras Background Set', { Mode: backgroundModePc });
    xapi.command('Cameras Background ForegroundParameters Set', foreground);
    MainCam_And_Content(content, mainCam);
}

function guiEvent(event) {
    if (event.WidgetId == 'widget_slider_opacity' && event.Type == 'released') {
        foreground.Opacity = Math.round(event.Value / 255 * 100);
        setWidgetOpacityText(foreground.Opacity);
        virtualBackground();
    }
}

xapi.event.on('UserInterface Extensions Widget Action', (event) => {
    if (event.WidgetId === 'swap_MainCam_Content' && event.Type === 'pressed') {
        xapi.command('Cameras Background Set', { Mode: defaultBackgroundMode, Image: defaultBackgroundImage });
        MainCam_And_Content(mainCam, content);
    }
    else if (event.WidgetId === 'swap_Content_MainCam' && event.Type === 'pressed') {
        xapi.command('Cameras Background Set', { Mode: defaultBackgroundMode, Image: defaultBackgroundImage });
        MainCam_And_Content(content, mainCam);
    }
    else if (event.WidgetId === 'swap_prominent' && event.Type === 'pressed') {
        xapi.command('Cameras Background Set', { Mode: defaultBackgroundMode, Image: defaultBackgroundImage });
        xapi.command("Video Input SetMainVideoSource", { ConnectorId: [2, 1], Layout: 'Prominent' });
        xapi.command("Presentation Start", { PresentationSource: [2, 1], Layout: 'Prominent' });
    }
    else if (event.WidgetId === 'swap_equal' && event.Type === 'pressed') {
        xapi.command('Cameras Background Set', { Mode: defaultBackgroundMode, Image: defaultBackgroundImage });
        xapi.command("Video Input SetMainVideoSource", { ConnectorId: [2, 1], Layout: 'Equal' });
        xapi.command("Presentation Start", { PresentationSource: [2, 1], Layout: 'Equal' });
    }
    else if (event.WidgetId === 'swap_video_composite' && event.Type === 'pressed') {
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
                virtualBackground(2500, 7500, 50);
                break;
            case 'middle':
                virtualBackground(5000, 7500, 50);
                break;
            case 'right':
                virtualBackground(7500, 7500, 50);
                break;
            case 'upperLeft':
                virtualBackground(1200, 1450, 30);
                break;
            case 'upperRight':
                virtualBackground(9200, 1450, 30);
                break;
            case 'large':
                virtualBackground(5000, 5000, 100);
                break;
            case 'clear':
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
});

function updateDefaultCamera(presentationMode) {
    if (presentationMode === 'Receiving') {
        resetToDefault();
    }
}

function resetToDefault() {
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
    setTimeout(getConferenceStatus, 50);
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

// Default background image is stored in the touchpanel
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

xapi.event.on('UserInterface Extensions Widget Action', guiEvent);




/*
Warranty & Licensing:
This is sample code.  There is no warranty for this code and no special licensing to use.  Like any custom deployment, it is the responsibility of the partner and/or customer to ensure that the customization works correctly on the device.
*/

