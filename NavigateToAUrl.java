/*
■Eclipseでのコンパイル、実行
○Java Bindingsの入手・解凍
・Selenium WebDriverのJava Bindingを下記からダウンロードし、適当な場所にunzipする
 ・URL：http://www.seleniumhq.org/download/
・以下、unzipされて出来たディレクトリが下記の場合を記載
 ・D:\TEMP\selenium-2.53.0-Java-Driver
○Eclipseでプロジェクトのセットアップ
 ・「ファイル」メニューから「新規」/「Javaプロジェクト」を選択
 ・「プロジェクト名」(例えばSelenium-ex1とする)を入力し「次へ」をクリック
 ・「ライブラリー」タブを選択
 ・「外部JARの追加」をクリック
 ・下記の２つのファイルを選択し、「開く」をクリック
  ・selenium-java-2.53.0.jar
  ・selenium-java-2.53.0-srcs.jar
 ・「外部JARの追加」をクリック
 ・libsの下にある全jarファイルを選択し、「開く」をクリック
 ・完了をクリック
○Eclipseでソースファイルの作成
 ・パッケージ・エクスプローラーの「Selenium-ex1」を右クリックし、
   「新規」/「クラス」を選択
 ・「名前」にクラス名(例えばNavigateToAUrlとする)を入力し「完了」をクリック
 ・作成されたファイルに、本ファイルの中身を流し込む
○実行準備
 ・下記ファイルに適当な文字列を書いておく
  ・D:/TEMP/FileHandlerTest.txt
○実行
 ・「実行」メニューの「実行」/「Javaアプリケーション」を選択
○補足
 ・Eclipse環境内では、コンテンツ・アシストで色々表示される
 ・例えば、「driver.」と入力すると、候補となるメソッド一覧が表示される
 ・「driv」まで入力し、「Control-SPACE」を押すと、候補が表示される
*/
import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;

import org.openqa.selenium.By;
import org.openqa.selenium.Cookie;
import org.openqa.selenium.Keys;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.interactions.Actions;
import org.openqa.selenium.io.FileHandler;
import org.openqa.selenium.remote.DesiredCapabilities;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

public class NavigateToAUrl {
	public static void main(String[] args) throws IOException {
		boolean skipTemplate = true;

		Map<String, Boolean> capabilitiesMap = new HashMap<>();
		capabilitiesMap.put("takeScreenShot", true);
		capabilitiesMap.put("handlesAlert", true);
		capabilitiesMap.put("cssSelectorsEnabled", true);
		capabilitiesMap.put("javascriptEnabled", true);
		capabilitiesMap.put("acceptSSLCerts", true);
		capabilitiesMap.put("webStorageEnabled", true);
		DesiredCapabilities capabilities = new DesiredCapabilities(capabilitiesMap);
		WebDriver driver = new FirefoxDriver(capabilities);

		// 暗黙の待ち時間を全体で設定　詳細は： http://softwaretest.jp/labo/tech/labo-294/
		driver.manage().timeouts().implicitlyWait(1, TimeUnit.SECONDS);

		driver.get("http://www.google.com");
		WebElement searchBox = driver.findElement(By.name("q"));

		searchBox.clear();
		searchBox.sendKeys("Java Files");

		System.out.println("TagName     = " + searchBox.getTagName());
		System.out.println("Location    = " + searchBox.getLocation());
		System.out.println("Size        = " + searchBox.getSize());
		System.out.println("Text        = " + searchBox.getText());
		System.out.println("isDisplayed = " + searchBox.isDisplayed());
		System.out.println("isEnabled   = " + searchBox.isEnabled());
		System.out.println("isSelected  = " + searchBox.isSelected());
		System.out.println("Attr name   = " + searchBox.getAttribute("name"));
		System.out.println("Attr id     = " + searchBox.getAttribute("id"));
		System.out.println("Attr class  = " + searchBox.getAttribute("class"));
		System.out.println("Css background-color = " + searchBox.getCssValue("background-color"));
		System.out.println("Css font-famiry      = " + searchBox.getCssValue("font-famiry"));

		searchBox.submit();

		// driver.findElement(By.id("cnt")); // 検索結果が出るのを待つ
		// 下記はもっと一般的な方法
		// Conditionの例：
		//   textToBePresentInElement：要素のテキストが変更されるまで待つ
		//   titleContains(String) : タイトルがある文字列を含む
		//   presenceOfElementLocated(Locator) : HTML要素が現れる（見えているかどうかは無関係）
		//   visibilityOfElementLocated(Locator) : HTML要素が可視状態になる
		//   elementToBeClickable(Locator) : HTML要素がクリック可能になる
		WebDriverWait wait = new WebDriverWait(driver, 3);
		wait.until(ExpectedConditions.titleContains("Java"));

		File screenShotFile = ((TakesScreenshot)driver).getScreenshotAs(OutputType.FILE);
		System.out.println("ScreenShotFilePath = " + screenShotFile.getAbsolutePath());

		// WebDriverのFileHandlerクラスを使ったコピーなど
		// copyではディレクトリのコピーや、suffixの指定も可能
		FileHandler.copy(new File(screenShotFile.getAbsolutePath()),
						 new File("D:/TEMP/SeleniumScreenShot.png"));

		// createDirは多重階層のDirectoryを一度に作れる。既存でもエラーにならない優れもの
		FileHandler.createDir(new File("D:/TEMP/Selenium/test1/test2/test3/"));

		// deleteは多重階層のDirectoryを一度に消せる優れもの ("rm -r"に相当)。 
		FileHandler.delete(new File("D:/TEMP/Selenium/test1"));

		// テキストファイルの中身を読める (ただし、日本語は文字コードがおかしくなるのでNG)
		String filecontent = FileHandler.readAsString(new File("D:/TEMP/FileHandlerTest.txt"));
		System.out.println(filecontent);

		// SeleniumのFileHandlerではファイル書き込みのメソッドはない
		// copy, creatDir, readAsStringはFilesでも同様のメソッドがある
		// Filesならばファイル書き込みのメソッドもある
		
		// Cookie
		Set<Cookie> cookies = driver.manage().getCookies();
		System.out.println("COOKIE:");
		for (Cookie ck : cookies) {
			System.out.print("Name=" + ck.getName());
			System.out.print(", Value=" + ck.getValue());
			System.out.print(", Domain=" + ck.getDomain());
			System.out.print(", Path=" + ck.getPath());
			System.out.print(", Expiry=" + ck.getExpiry());
			System.out.print(", isSecure=" + ck.isSecure());
			System.out.println("");
		}

		if (!skipTemplate) {
			//		各種操作のテンプレート (googleサイトでは無効)
			WebElement one, two, three, four, five;
			one = two = three = four = five = null;
			Actions builder = new Actions(driver);

			builder.keyDown(Keys.CONTROL)
				.click(one)
				.click(two)
				.keyUp(Keys.CONTROL)
				.clickAndHold(three)
				.moveToElement(four)
				.release()
				.moveByOffset(120, 0)
				.perform();
			builder.dragAndDrop(one,  two).perform();
			builder.doubleClick(two).perform();
			builder.contextClick(five)
				.click(driver.findElement(By.name("Item 3")))
				.perform();

			driver.switchTo().frame(0);
			driver.switchTo().defaultContent();
			driver.switchTo().frame("frame name");

			driver.navigate().to("another page url");
			driver.navigate().back();
			driver.navigate().forward();
			driver.navigate().refresh();

		}
	}
}
