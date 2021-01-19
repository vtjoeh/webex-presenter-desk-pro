# webex-presenter-desk-pro
Use the Webex Desk Pro feature of PC overlay in a Webex Meetings and get a full screen presentation.   
  
*Note: This code uses an API that might will require your Desk Pro be in Preview or beta channel for RoomOS.*

  
**Problem:** The Webex Desk Pro has a great feature where the PC input is a virtual background during a presentation.  The problem is that the default view in Webex Meeting is Grid View which means you will show up in only one small portion of the screen.  
  
![Before Picture](/images/before.png)
  
<br/><br/><br/>
**Solution:** This macro allows you to send the PC Overlay source as the content channel from the Desk Pro.  Therefore participants in will see the following view:  
![After Picture](/images/after.png)
  
<br/><br/><br/>
**Screen shot of Touch 10** 
<br/>![Touch Panel](/images/touchpanel.png)
<br/><br/><br/>
    
The macro does not require a touch panel be attached to the Desk Pro, but it makes it easier to see the screen when you use the buttons.  
  
***Some of the buttons:***   
  
**Default (Main Cam Only)** - Return to sending main camera only. 
  
**Present Me** - Only presents you full screen in the content channel.  

**Present my PC** - Same as sharing your PC.  

**My Opacity (PC Overlay)** - Changes your opacity when the PC input is the virtual background. 

The macro remembers your last virtual background before selecting the PC as the virtual background.  When the **Default (Main Cam Only)** button is cliked it will return to this background (e.g. custom image, preloaded background, background blur, none).   

The macro determines if your USB-C or HDMI input is available on startup.  If both are connected, it defaults to the USB-C input.  This can be overwritten by selecting the **Defaults** tab and selecting the **USB** or **HDMI** button next to **Default PC Overlay Source**.  This is reset if the Desk Pro is powered on and off.  

 
