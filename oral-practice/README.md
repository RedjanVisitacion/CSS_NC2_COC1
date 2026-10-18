# CSS Picture Quiz

Double-click Start Oral Practice.bat. It opens http://localhost:8765. Keep the server window running; opening index.html directly cannot record scores. The complete quiz works offline with no account or microphone.

Students enter a name, receive 10 random questions from all topics and identify each photo using four choices. They may answer aloud before selecting. Each question scores once. Results include a photo review and downloadable text report. Questions and choices are shuffled for each attempt.

Includes 23 hardware photo questions. Labeled external-parts and rear-panel diagrams appear in Study references. The orange chipset image is labeled Northbridge and the silver chipset image Southbridge, following the classroom identification supplied by the teacher.

The creator credit is Redjan Phil S. Visitacion. Individual answers stay in memory unless a report is downloaded; completed attempts also save the student name and score on this computer. The supplied portrait appears by the creator credit.

This is a classroom practice tool, not a secure examination system or official TESDA assessment. Previous content.js and build_content.py are unused by the new picture quiz. prepare_quiz.py rebuilds quiz assets from the supplied Downloads files.

During a quiz, navigation and the home header are hidden. Use Exit quiz to leave, or finish the attempt. Each question has a two-minute countdown. Time expiry locks the choices and scores the question as unanswered; use Next photo to continue. The timer uses elapsed wall-clock time and does not pause in background tabs. The browser may warn before closing or reloading an active quiz. Ordinary websites cannot block browser tabs or browser controls.

Completed attempts automatically append to records/Quiz Scores.xlsx with exactly two columns: Name and Score. Score includes the question count (for example 8 / 10). Every attempt gets its own row. Names are required. The server also keeps a SQLite backup in records. Keep the workbook closed during quizzes so Excel does not prevent updates. If saving fails, close Excel and use Retry saving; retries do not create duplicate rows. Results are stored on this computer only. The result page also offers a download of all class scores. Exited attempts are not recorded.

Picture Quiz opens behind a password prompt, including on first page load. Password: Redjan09. Clicking the Picture quiz tab requires the password again. This is a browser-side classroom access gate; the password is visible in the local source, so it is not secure authentication.

Study references allow five minutes from the first visit. The countdown remains visible while scrolling. At expiry, references close and the quiz password prompt opens. Proceed to quiz now skips the remaining study time. Study cannot reopen afterward within the same page session; leaving and returning does not reset the deadline. Refreshing preserves the study deadline and completed study status in the same browser tab.

Spin the wheel loads unique names from completed quiz records. Click Spin for the next student to randomly select an oral presenter. Each student is selected once per round. Case and extra spacing are ignored when merging repeat names. Presentation order is stored in the local database and survives reloads. Refresh names picks up new quiz takers. Start a new round clears only oral presentation order, preserving all quiz scores. Restart the local launcher after installing this update.

Refresh recovery: the same tab restores the active quiz, student name, question order, choices, answers, and original timer deadline. Refreshing does not grant more time. Completed results are restored and saved again with the same attempt ID, preventing duplicate Excel rows. Exit quiz explicitly discards the unfinished quiz. This recovery uses browser session storage; keep the same browser tab and localhost address. Closing the tab or clearing browser session data can remove unfinished progress. Completed scores and oral order remain saved on disk.

Name-first flow: enter the student full name on the welcome screen to load saved study eligibility. New names receive five minutes; returning names resume their original deadline. Finishing or skipping study permanently uses that name's study allowance. Names already in completed quiz records skip directly to the quiz password screen. These study records live in the local database and survive refresh, new tabs, and server restarts. Matching ignores case and repeated spaces. Next student / change name returns to the welcome screen without changing scores or giving previous names new study time.

Restart server: use the button at the bottom of the page and enter Redjan09. The Python launcher restarts the server and the page reloads when it is ready. This preserves database records and tab recovery. Restart is unavailable during an active quiz. One manual close/reopen of Start Oral Practice.bat is required to load the new restart-capable launcher.

The quiz setup has no topic or question-count dropdowns. Every new attempt draws 10 distinct photo questions randomly from the complete question bank. Existing unfinished attempts keep their saved questions when resumed.

Direct quiz flow: after study expiry or Proceed to quiz now, the first of 10 random questions opens automatically. Quiz password and setup screens have been removed. Restart server still requires Redjan09.
