    var rolLength = 6;
    var setNum;
    var hiddenInput = document.createElement("input");
    hiddenInput.className = "hidden-input";

    // 랜덤 숫자 생성 함수
    const rRandom = () => {
      var min = Math.ceil(0);
      var max = Math.floor(rolLength - 1);
      return Math.floor(Math.random() * (max - min)) + min;
    };

    // 룰렛 회전 함수
    const rRotate = () => {
      var panel = document.querySelector(".rouletter-wacu");
      var btn = document.querySelector(".rouletter-btn");
      var deg = [];

      for (var i = 1, len = rolLength; i <= len; i++) {
        deg.push((360 / len) * i);
      }

      var num = 0;
      document.body.append(hiddenInput);
      setNum = hiddenInput.value = rRandom();

      var ani = setInterval(() => {
        num++;
        panel.style.transform = "rotate(" + 360 * num + "deg)";
        btn.disabled = true;
        btn.style.pointerEvents = "none";

        if (num === 50) {
          clearInterval(ani);
          panel.style.transform = `rotate(${deg[setNum]}deg)`;
        }
      }, 50);
    };


    // 팝업 함수와 결과 저장 함수
    const rLayerPopup = (num, point) => {
      var currentDate = new Date();
      switch (num) {
        case 1:
          swal('당첨!!', '100포인트 지급', 'success').then(() => {
            location.reload(); // Reload the page when swal is closed
          });
          saveRouletteResult("당첨, 100포인트", 100, currentDate);
          break;
        case 3:
          swal('당첨!!', '300포인트 지급', 'success').then(() => {
            location.reload(); // Reload the page when swal is closed
          });
          saveRouletteResult("당첨, 300포인트", 300, currentDate);
          break;
        case 5:
          swal('당첨!!', '1000포인트 지급', 'success').then(() => {
            location.reload(); // Reload the page when swal is closed
          });
          saveRouletteResult("당첨, 1000포인트", 1000, currentDate);
          break;
        default:
          swal('꽝~', '다음기회에..', 'error').then(() => {
            location.reload(); // Reload the page when swal is closed
          });
          saveRouletteResult("꽝", 0, currentDate);
          break;
      }
    };

    // 결과 저장 함수 (AJAX로 서버에 전송)
    const saveRouletteResult = (result, point, currentDate) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/roulette/save", true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.setRequestHeader("X-CSRF-TOKEN", document.querySelector('meta[name="_csrf"]').getAttribute('content'));
      xhr.setRequestHeader("X-CSRF-HEADER", document.querySelector('meta[name="_csrf_header"]').getAttribute('content'));

      xhr.onreadystatechange = function () {
        if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
          console.log("Roulette result saved successfully");
          console.log(`Points (${point}) saved successfully`);
        } else if (xhr.readyState === XMLHttpRequest.DONE) {
          console.log("Failed to save roulette result");
        }
      };

      const data = JSON.stringify({ result, point, currentDate: currentDate.toISOString().split("T")[0] });
      xhr.send(data);
    };

    // 리셋 함수
    const rReset = (ele) => {
      setTimeout(() => {
        ele.disabled = false;
        ele.style.pointerEvents = "auto";
        rLayerPopup(setNum);
        hiddenInput.remove();
      }, 5500);
    };


    // 룰렛 이벤트 클릭 버튼
    document.addEventListener("click", function (e) {
      var target = e.target;
      if (target.tagName === "BUTTON") {
        var canSpin = document.querySelector(".rouletter").getAttribute("data-can-spin");
        if (canSpin === "true") {
          rRotate();
          rReset(target);
        } else {
          swal("한번만 돌릴 수 있습니다");
        }
      }
    });
