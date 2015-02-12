package me.carylorrk.ponysticker.plugin;

import java.io.File;
import java.io.FileOutputStream;

import android.app.Activity;
import android.content.Intent;
import android.R;
import android.util.Base64;
import android.net.Uri;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

import org.apache.cordova.CordovaWebView;
import org.apache.cordova.CordovaActivity;
import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.PluginResult;
import org.json.JSONArray;


public class PonyPlugin extends CordovaPlugin {

    /**
     * Constructor.
     */
    public PonyPlugin() {
    }

    /**
     * Sets the context of the Command. This can then be used to do things like
     * get file paths associated with the Activity.
     *
     * @param cordova The context of the main Activity.
     * @param webView The CordovaWebView Cordova is running in.
     */
    public void initialize(CordovaInterface cordova, CordovaWebView webView) {
        super.initialize(cordova, webView);
    }

    /**
     * Executes the request and returns PluginResult.
     *
     * @param action            The action to execute.
     * @param args              JSONArry of arguments for the plugin.
     * @param callbackContext   The callback id used when calling back into JavaScript.
     * @return                  True if the action was valid, false if not.
     */
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) {
        try{
            if (action.equals("available")) {
                callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK));
                return true;
            
            } else if (action.equals("checkIntent")) {
                CordovaActivity activity = (CordovaActivity)this.cordova.getActivity();
                Intent intent = activity.getIntent();
                String intentAction = intent.getAction();
                if (intentAction.equals(Intent.ACTION_MAIN)) {
                    callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, "main"));
                    return true;
                } else {
                    callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, "other"));
                    return true;
                }
            } else if (action.equals("setResultWithBase64")) {
                if (args.length() != 1) {
                    return false;
                }
                String imgBase64 = args.getString(0);
                String url = saveBase64(imgBase64);

                Intent result = new Intent();
                result.setAction(Intent.ACTION_VIEW);
                result.setDataAndType(Uri.parse(url), "image/jpg");

                CordovaActivity activity = (CordovaActivity)this.cordova.getActivity();
                activity.setResult(Activity.RESULT_OK, result);
                activity.finish();
                callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK));
                return true;
            } else if (action.equals("shareWithBase64")){
                if (args.length() != 1) {
                    return false;
                }
                String imgBase64 = args.getString(0);
                String url = saveBase64(imgBase64);

                Intent share = new Intent();
                share.setAction(Intent.ACTION_SEND);
                share.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                share.putExtra(Intent.EXTRA_STREAM, Uri.parse(url));
                share.setType("image/jpeg");
                Intent chooser = Intent.createChooser(share, "Share image to...");
                chooser.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                this.cordova.getActivity().getApplicationContext()
                    .startActivity(chooser);
                return true;
            } else {
                return false;
            }
        } catch (Exception e) {
            e.printStackTrace();
            String errorMessage=e.getMessage();
            callbackContext.error(errorMessage);
            return false;
        }
    }

    private String saveBase64(final String imgBase64) throws Exception {
        final String dirName = webView.getContext().getExternalFilesDir(null) + "/ponysticker";
        createDir(dirName);
        String fileName = sha1(imgBase64)+".jpg";
        saveFile(Base64.decode(imgBase64, Base64.DEFAULT), dirName, fileName);
        String url = "file://" + dirName + "/" + fileName;
        return url;
    }

    private void createDir(final String downloadDir) throws Exception {
        final File dir = new File(downloadDir);
        if (!dir.exists()) {
            if (!dir.mkdirs()) {
                throw new Exception("CREATE_DIRS_FAILED");
            }
        }
    }

    private String sha1(String input) throws NoSuchAlgorithmException {
        MessageDigest mDigest = MessageDigest.getInstance("SHA1");
        byte[] result = mDigest.digest(input.getBytes());
        StringBuffer sb = new StringBuffer();
        for (int i = 0; i < result.length; i++) {
            sb.append(Integer.toString((result[i] & 0xff) + 0x100, 16).substring(1));
        }
         
        return sb.toString();
    }

    private void saveFile(byte[] bytes, String dirName, String fileName) throws Exception {
        final File dir = new File(dirName);
        cleanupOldFiles(dir);
        final FileOutputStream fos = new FileOutputStream(new File(dir, fileName));
        fos.write(bytes);
        fos.flush();
        fos.close();
    }

    private void cleanupOldFiles(File dir) {
        for (File f : dir.listFiles()) {
            f.delete();
        }
    }
}
