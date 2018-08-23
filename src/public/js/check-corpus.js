function afterBodyLoaded() {
  let xhttp = new XMLHttpRequest();
  let corpus = document.getElementById('name').innerHTML;
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      let result = JSON.parse(this.responseText);
      document.getElementById('name').innerHTML = result.name;
      document.getElementById('out_of_vocabulary_words').innerHTML = result.out_of_vocabulary_words;
      document.getElementById("total_words").innerHTML = result.total_words;
      document.getElementById('status').innerHTML = result.status;
      let button = document.getElementById('formButton');
      if (result.status === 'analyzed') {
        button.innerHTML = 'Train';
        button.disabled = false;
      } else {
        let text = button.innerHTML.concat('.');
        if (text.length > 4) {
          text = '.';
        }
        button.innerHTML = text;
        setTimeout(afterBodyLoaded, 2000);
      }
    }
  };
  xhttp.open("GET", "/api/getCorpus?corpus=" + corpus, true);
  xhttp.send();
}
