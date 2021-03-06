# node-live-stream-recorder

Self-hosted solution for recording live streams from websites such as YouTube,
Twitch, etc.

![Screenshot](https://user-images.githubusercontent.com/23465488/172434417-10aec8ee-096d-4c64-ae9b-9cb7d1a0bd3f.jpg)

## Prerequisites

Before starting, you should make sure that you have installed
[git](https://git-scm.com), [Node.js](https://nodejs.org) (>=12.0.0), npm and a
web browser (preferably latest Chrome or Firefox).

## How to start

First clone this repository to your computer using the following command:

```shell
git clone https://github.com/vabushkevich/node-live-stream-recorder.git
```

Then go to the downloaded folder and install all required dependencies:

```shell
cd node-live-stream-recorder
npm install
```

Now copy the `.env.dist` file to `.env`:

```shell
cp .env.dist .env
```

Then you need to configure the program:

1. Open the `.env` file in a text editor.
2. Remove the hash sign (`#`) before the `RECORDINGS_ROOT` and `BROWSER_PATH`
   environment variables.
3. Replace `/path/to/recordings/directory` with the path to the folder where the
   live stream recordings will be saved.
4. Replace `/path/to/browser/executable` with the path to the executable file of
   the web browser.
5. Save the file.

The contents of the `.env` file should now look something like this:

```
RECORDINGS_ROOT=E:/stream-recordings
BROWSER_PATH=C:/Program Files (x86)/Google/Chrome/Application/chrome.exe
```

At this point, you can get started. Run the following command to compile
required files and to start the web server:

```shell
npm start
```

Wait for the message "Live stream recorder web server has been started...".

If you are working locally, open `http://localhost:5370` in your web browser.
You should see a page with an interface allowing you to record live streams.
