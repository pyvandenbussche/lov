function addInput(divName,dataArray,value){
    var newdiv = document.createElement('div');
    newdiv.innerHTML = "<input type='text' name='"+dataArray+"[]', value='"+value+"'><span onClick='this.parentNode.remove();'>Remove</span>";
    document.getElementById(divName).appendChild(newdiv);
}