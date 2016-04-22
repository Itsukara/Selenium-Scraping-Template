// Run in strict mode
"use-strict"

var fs = require('fs');
var request = require('request');
var webdriver = require('selenium-webdriver'),
    By = webdriver.By,
    until = webdriver.until;

// Initial Setting
// IDとパスワードを設定してから使用のこと
var ID="";
var PASS = "";

console.log("");
if (ID === "" || PASS === "") {
  console.log("'" + __filename + "'中でIDとパスワードを記載してから実行願います。");
  process.exit(0);
}

//////////////////////////////////////////////
// 各種ユーティリティー関数
//////////////////////////////////////////////
// ファイル名のnormalize
function f_normalize(fname) {
  return fname.replace(/\\|\/|\:|\*|\?|\"|\<|\>|\|/g, "-");
}

// ディレクトリ名のnormazlie ("/"はそのままにする)
function d_normalize(dname) {
  return dname.replace(/\\|\:|\*|\?|\"|\<|\>|\|/g, "-");
}

// ディレクトリーの作成
function mkdirSyncIfNotExit(dir) {
//  console.log("mkdirSyncIfNotExit: " + dir);
  dir = d_normalize(dir);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
}

// ディレクトリーツリーの作成
function mkdirTreeSyncIfNotExit(fname) {
  var dirA = fname.split("/").slice(0, -1);
  var dir = "";
  for (i = 0; i < dirA.length; i++) {
    dir += dirA[i] + "/";
    mkdirSyncIfNotExit(dir);
  }
}

// ファイルへの書き込み(テキストデータ)
function write_file(fname, data) {
  fname = fname.replace(/^[\/]*/, "");
  fname = d_normalize(fname);
  mkdirTreeSyncIfNotExit(fname);
  fs.writeFile(fname, data);
}

// サイトからデータを取得しファイルへ書き込み(バイナリーも可、cooke付与)
function request_withcookie(url, fname) {
  fname = fname.replace(/^[\/]*/, "");
  fname = d_normalize(fname);
  mkdirTreeSyncIfNotExit(fname);

  // cookieの付与
  var jar = request.jar();
  for (var i = 0; i < cookies.length; i++) {
    var ck = cookies[i];
    var rck = request.cookie(ck.name + "=" + ck.value);
    jar.setCookie(rck, url);
  }
  
  // cookie付きのデータ取得
  request.get({url: url, jar: jar}).pipe(fs.createWriteStream(fname));
}
//////////////////////////////////////////////

// Selenium Driverの初期化
var driver = new webdriver.Builder()
    .forBrowser('firefox')
    .build();

// @Before
baseUrl = "http://bbb.com/";
driver.manage().timeouts().implicitlyWait(1000);

// @Scraping開始
driver.get(baseUrl + "/");
driver.findElement(By.id("login")).click();
driver.findElement(By.id("login_id")).clear();
driver.findElement(By.id("login_id")).sendKeys(ID);
driver.findElement(By.id("password")).clear();
driver.findElement(By.id("password")).sendKeys(PASS);
driver.findElement(By.id("login_button")).click();
driver.findElement(By.linkText("コンテンツ一覧")).click();

// cookiesの取得(request_withcookie()で使用)
var cookies = "";
driver.manage().getCookies().then(function(v) {
  cookies = v;
});

// スクレイピング処理の本体
var content_links = get_content_links();
var content_name = "";
get_content(content_links);

// スクレイピング処理関数
function get_content(content_links) {
  if (content_links.length > 0) {
    var content_info = content_links.shift();
    var content_name = content_info[0];
    var content_link = content_info[1]; 
    console.log("■" + content_name);
    driver.get(content_link)
    .then(function() {
      // コンテンツの概要をテキストで抽出
      driver.executeScript(get_content_summary)
      .then(function(content_summary) {
        content_name = f_normalize(content_name);
        mkdirSyncIfNotExit(content_name);
        write_file(content_name + "/" + content_name + ".txt", content_summary);
        
        // サブコンテンツ情報抽出
        driver.executeScript(get_subcontent_links)
        .then(function(subcontent_links) {
          // デバッグ用に対象を少なくする：
          // subcontent_links = subcontent_links.slice(subcontent_links.length - 3);
          get_subcontent(subcontent_links);
        });
      });
    }); 
  } else {
    console.log("■■■■ FINISHED ■■■■");
    driver.quit();
  }
}

function get_subcontent(subcontent_links) {
  if (subcontent_links.length > 0) {
    var subcontent_info = subcontent_links.shift();
    var subcontent_name = subcontent_info[0];
    var subcontent_link = subcontent_info[1]; 
    driver.get(subcontent_link)
    .then(function() {
      console.log("・" + subcontent_name);
      subcontent_name = f_normalize(subcontent_name);
      var subcontent_dir = content_name + "/" + subcontent_name;
      mkdirSyncIfNotExit(subcontent_dir);
      
      // サブコンテンツの概要をテキストで抽出
      driver.executeScript(get_subcontent_summary)
      .then(function(subcontent_summary) {
        write_file(subcontent_dir + "/" + subcontent_name + "-summary.txt", subcontent_summary);
      });
      

      // ページ内容から直接抽出できるリソースの処理
      driver.findElements(By.css('resouces_1 tab'))
      .then(function(element_array) {
        if (element_array.length > 0) {
          // 該当リソースのタブをクリックし、リソースを表示
          element_array[0].click();
          // リソースが表示されたことの確認
          driver.findElement(By.css('resouces_1 displayed'))
          .then(function() {
            // ブラウザ側でリソース内容を抽出し、node側でファイルに保管
            driver.executeScript(get_resouces_1)
            .then(function(resouces_1) {
              for (var i = 0; i < resouces_1.length; i++) {
                var fname = d_normalize(resouces_1[i].fname);
                var fcontent = resouces_1[i].fcontent;
                write_file(subcontent_dir + "/" + fname, fcontent);
              }
            });
          });
        }
      });

      // ページ内容からURLが抽出できるリソースの処理
      // (1) cookie無しで取得できるリソース
      driver.findElements(By.css('resouces_2 tab'))
      .then(function(element_array) {
        if (element_array.length > 0) {
          // 該当リソースのタブをクリックし、リソースを表示
          element_array[0].click();
          // リソースが表示されたことの確認
          driver.findElement(By.css('resouces_2 displayed'))
          .then(function() {
            driver.executeScript(get_resouces_2)
            .then(function(resouces_2) {
              for (var i = 0; i < resouces_2.length; i++) {
                var fname = d_normalize(resouces_2[i].fname);
                var furl = resouces_2[i].furl;
                request.get(furl).pipe(fs.createWriteStream(subcontent_dir + "/" + fname));
              }
            });
          });
        }
      });

      // ページ内容からURLが抽出できるリソースの処理
      // (2) cookie付きで取得できるリソース
      driver.findElements(By.css('resouces_3 tab'))
      .then(function(element_array) {
        if (element_array.length > 0) {
          // 該当リソースのタブをクリックし、リソースを表示
          element_array[0].click();
          // リソースが表示されたことの確認
          driver.findElement(By.css('resouces_3 displayed'))
          .then(function() {
            driver.executeScript(get_resouces_3)
            .then(function(resouces_3) {
              for (var i = 0; i < resouces_3.length; i++) {
                var fname = d_normalize(resouces_3[i].fname);
                var furl = resouces_3[i].url;
                request_withcookie(furl, subcontent_dir + "/" + fname);
              }
            });
          });
        }
      });
    });
    
    get_subcontent(subcontent_links);
  }
}

//
// Functions executed in browser
//

// コンテンツの概要を収集し、テキスト化して返す
function get_content_summary () {
  var content_summary = "";
  
  // for (...) {
  //   content_summary += ....
  // }
  
  return content_summary;
}

// サブコンテンツの名称とURLを収集して返す
function get_subcontent_links() {
  subcontent_links = [];
  
  // for (...) {
  //   subcontent_links.push([name, link]);
  // }

  return subcontent_links;
}

// サブコンテンツの概要を収集し、テキスト化して返す
function get_subcontent_summary() {
  var subcontent_summary = "";

  // for (...) {
  //   subcontent_summary += ....
  // }

  return subcontent_summary;
}

// サブコンテンツのリソース内容をテキストで抽出し、ファイル名と共に返す
function get_resouces_1() {
  var rsources = [];

  // for (...) {
  //   rsources.push({fname: fname, fcontent: fcontent});
  // }

  return sources;
}

// サブコンテンツの名称とURLを抽出して返す
// (1) cookie無しで取得できるリソース
function get_resouces_2() {
  var rsources = [];

  // for (...) {
  //   rsources.push({fname: fname, furl: furl});
  // }

  return sources;
}

// サブコンテンツの名称とURLを抽出して返す
// (2) cookie付きで取得できるリソース
function get_resouces_3() {
  var rsources = [];

  // for (...) {
  //   rsources.push({fname: fname, furl: furl});
  // }

  return sources;
}


// コンテンツ一覧 (下記に記載する)
function get_contents() {
	var contents = [
	["１つめのコンテンツ", "http://bbb.com/contents/content_001"],
	["２つめのコンテンツ", "http://bbb.com/contents/content_002"],
	["３つめのコンテンツ", "http://bbb.com/contents/content_003"],
	["４つめのコンテンツ", "http://bbb.com/contents/content_004"],
	["５つめのコンテンツ", "http://bbb.com/contents/content_005"],
	];
	
// デバッグおよび途中再開用
//	get_contents = get_contents.slice(2, 4);

	return contents;
}
