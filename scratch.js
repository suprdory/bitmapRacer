// used to read image uplaoded by user

document.getElementById('myFile').onchange = function (evt) {
    var tgt = evt.target || window.event.srcElement, files = tgt.files;
    // FileReader support
    if (FileReader && files && files.length) {
        var fr = new FileReader();
        fr.onload = () => showImage(fr);
        fr.readAsDataURL(files[0]);
    }
}