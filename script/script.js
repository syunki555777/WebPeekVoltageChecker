/*jx20143 鈴木舜基 kogakuin-univ*/
/*読み込まれたファイルが入る*/
let files;
/*電圧の閾値*/
let threshold = 3.0;

window.onload = function () {//HTMLの読み込み完了時に呼び出し
    //ブラウザの対応状況確認
    if (window.File) {
        //ブラウザがFileAPIに対応している時の処理
        console.log("FileAPIに対応");

    } else {
        //ブラウザが非対応の時の処理
        var div = document.createElement('div');
        div.classList.add('error');
        div.innerHTML = "お使いの環境ではFileAPIを使用できないため、スクリプトを実行することができません。";
        document.getElementsByTagName("body")[0].insertBefore(div,  document.getElementsByTagName("body")[0].firstChild);
        console.log("FileAPIに非対応");
    }
}
//ファイルをドロップした時の処理
function onDrop(event){
    files = event.dataTransfer.files;
    console.log(`${files.length}個のファイルが読み込まれました。`);
    if(files.length>1){//ファイルの数が1つより多い時
        let newFiles = [];
        let errorCount = 0;
        
        for(let i = 0;i < files.length;i++){
            let f = files[i];
                if(f.type.match('text.*')){
                    newFiles.push(f);
                    console.log(f.name+"は"+f.type+"で読み込まれた。");
                }else {
                    console.error(f.name+"は読み込まれなかった。");
                    errorCount++;
                }
        }

        if(newFiles ==null){
            Error("ファイルが読み込まれませんでした。");
        }else{
            if(errorCount > 0){
                Error(errorCount+"個のファイルが読み込まれませんでした。");
            }
            files = newFiles;
        }

    }else{//一つだった時
        if (!files[0].type.match('text.*')) {//ファイルがテキストファイルじゃなかった場合、削除
            Error("textファイルのみ対応しています。");
            files = null;
        }else ErrorReset();
    }


    event.preventDefault();
}
function onDragOver(event){
    event.preventDefault();
}

function Error(errorString){
    try{
        document.getElementsByClassName('error').item(0).remove();
    }catch(e){

    }
    var div = document.createElement('div');
    div.classList.add('error');
    div.innerHTML = errorString;
    document.getElementsByTagName("body")[0].insertBefore(div,  document.getElementsByTagName("body")[0].firstChild);
}
function ErrorReset(){
    try{
        document.getElementsByClassName('error').item(0).remove();
    }catch(e){

    }
}


function Convert(){
    const thresholdElem = document.getElementById("threshold");
    threshold = thresholdElem.value;
    if(files == null){
        Error("ファイルが読み込まれていません。");
        return;
    }


    let file = files[0];
    for (let i = 0; i < files.length; i++) {

    let reader = new FileReader();
    reader.onerror = function(){//読み込みに失敗したときの処理
        Error("読み込みに失敗しました。");
    };

    /*ピーク電圧の探査
    * 1.測定順に閾値よりも高い電位を探査
    * 2.閾値よりも高くなったら最も高い電圧を探査
    * 3.閾値を下回ったらその間で最も高かった電圧と時間を記録
    * 4.すべて探査し終わるまで上記を繰り返す。
    * */
    reader.onload = function (){//読み込みに成功した時の処理
        let dataResult = new Map();//結果を書き込む
        console.log(reader.result);//確認用
        let lines = reader.result.split(/\r?\n/);//改行部分ごとに要素を分ける。
        console.log(lines.length+"行");//確認用
        if(lines.length > 1){//データ数が一つ以上
            let timeDelta = 0;//閾値を超えた地点の記録
            let maxVolt = 0;//最大電圧記録用
            let maxTime = 0;//最大電圧時の時間記録用
                lines.forEach(e => {//行の中を線形探査
                let data = e.split(',');//カンマでデータを分ける。
                if(data.length === 2){//データの列が2列だった場合
                    let time = Number(data[0]);
                    let volt = Number(data[1]).toFixed(2);
                    if(!Number.isNaN(time)&&!Number.isNaN(volt)){//データが数値であることを確認
                        //閾値を上回ったらその間の最大値を記録、その後、下回ったら最大値と時間をmapに入れる。
                        if(threshold < volt&&maxVolt < volt){//電圧が閾値以上　かつ　ボルトが今までの最大値
                            maxVolt = volt;
                            maxTime = time;
                            if(timeDelta === 0){
                                timeDelta = time;
                            }
                        }else if(threshold > volt&&maxVolt !== 0){//電圧が閾値以下　かつ 電圧が記録されている場合 == 閾値が下回った直後のデータ
                            if(time - timeDelta > 0.01) {//100Hz以上の場合に閾値を上回った間隔が0.01秒未満だった場合、誤差として計算
                                dataResult.set(maxTime, maxVolt);
                            }
                            maxVolt = 0;
                            maxTime = 0;
                            timeDelta = 0;
                        }
                    }else{
                        console.log("データが数値ではありませんでした。読み込みをスキップします。時間"+Number.isNaN(time) + time + "数値" + Number.isNaN(volt) + volt);
                        //データが数値として読み込めない行はスキップ
                    }
                }else{
                    console.log("列数が不正なため、読み込みをスキップします。");
                    //列数が二列ではない場所の探査はスキップ。
                }
            });
        }else{
            Error("データが一行しかないため、処理を終了しました。正しいファイルか確認してください。");
        }

        console.log(dataResult);//結果をコンソールに表示 (F12で確認可能)
        ShowResult(dataResult,file.name);//結果を表示

    };
            let file = files[i];
            reader.readAsText(file, 'UTF-8');
        }


}
//結果表示用
function ShowResult(map,fileName){
    let result = document.getElementsByClassName("result")[0];
    let div = document.createElement("div");
    div.innerHTML = fileName +" "+ map.size + "個</br>閾値:"+threshold+"V";
    if(map.size < 1){
        div.innerHTML = fileName;
        div.innerHTML = div.innerHTML.concat('</br>\n','ピーク電圧は検出されませんでした。');

        result.appendChild(div);
    return;
    }
    div.innerHTML = div.innerHTML.concat('</br>\n','<table border="1">\n<tr bgcolor="#d3d3d3"><th>回数</th><th>時間[s]</th><th>電圧[V]</th></tr></table>');
    let table = div.getElementsByTagName('table')[0];
    let i = 0;
    let text = "回数,時間[s],電圧[V]";
    map.forEach((volt,time) => {
        i++;
        table.insertAdjacentHTML("beforeend", `<tr><th>${i}</th><th>${time}</th><th>${volt}</th></tr>`);
        text = text.concat("\n",`${i},${time},${volt}`);
    });

    let bom  = new Uint8Array([0xEF, 0xBB, 0xBF]);
    let blob = new Blob([bom,text],{type:"text/csv"});
    let link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName.replace(".txt",".csv");
    link.innerHTML = "Download";
    div.insertAdjacentElement("beforeend",link);


    result.appendChild(div);
}