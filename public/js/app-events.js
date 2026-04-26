// Events & Bootstrap: event bindings and app initialization lifecycle.
    enterBtn.addEventListener("click", () => {
      loginAccount(loginCodeInput.value, loginPasswordInput.value);
    });

    switchAccountBtn.addEventListener("click", () => {
      logoutAccount();
    });

    if (sidebarToggleBtn) {
      sidebarToggleBtn.addEventListener("click", () => {
        toggleSidebarCollapsed();
      });
    }

    if (devTodoLauncher) {
      devTodoLauncher.addEventListener("click", () => {
        openDevTodoModal();
      });
    }

    operationNoticeStack.addEventListener("click", (event) => {
      const closeBtn = event.target.closest("[data-notice-close]");
      if (!closeBtn) return;
      const noticeCard = closeBtn.closest(".operation-notice");
      if (!noticeCard) return;
      const noticeKind = String(noticeCard.dataset.noticeKind || "").trim();
      const noticeKey = String(noticeCard.dataset.noticeKey || "").trim();

      if (noticeKind === "dispatcher") {
        operationNoticeDismissed = true;
        dismissedOperationNoticeLogId = noticeKey.startsWith("dispatcher:")
          ? noticeKey.slice("dispatcher:".length)
          : String(currentOperationNoticeLogId || "").trim();
        saveOperationNoticePreference();
        dispatcherOperationNoticeItem = null;
        hideOperationNotice({ keepCurrentId: true });
        return;
      }

      if (noticeKind === "accountant_assignment") {
        pendingAccountantNoticeItems = pendingAccountantNoticeItems.filter((item) => {
          const id = String(item?.id || "").trim();
          return `assign:${id}` !== noticeKey;
        });
        if (pendingAccountantNoticeItems.length) {
          savePendingAccountantNotices(pendingAccountantNoticeItems);
          renderOperationNoticeStack();
          return;
        }
        clearPendingAccountantNotices();
        hideOperationNotice({ keepCurrentId: true });
      }
    });

    changePasswordBtn.addEventListener("click", async () => {
      await openChangePasswordFlow();
    });

    if (changePasswordForm) {
      changePasswordForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (!requireAccount()) return;
        const accountName = String(currentAccount || "").trim();
        const newPassword = String(changePasswordInput?.value || "").trim();
        if (!accountName) return;
        if (!newPassword) {
          showInlineFormError({
            form: changePasswordForm,
            hintSetter: setChangePasswordHint,
            target: changePasswordInput,
            message: "请输入新密码。"
          });
          return;
        }

        setChangePasswordHint("密码保存中...", "pending");
        if (changePasswordSubmitBtn) {
          changePasswordSubmitBtn.disabled = true;
          changePasswordSubmitBtn.textContent = "保存中...";
        }

        try {
          if (isDispatcherLogin()) {
            await changeDispatcherPassword(newPassword);
          } else {
            await changeAccountantPassword(accountName, newPassword);
          }
        } catch (error) {
          console.error(error);
          showInlineFormError({
            form: changePasswordForm,
            hintSetter: setChangePasswordHint,
            target: changePasswordInput,
            message: error.message || "修改密码失败，请稍后重试。"
          });
          if (changePasswordSubmitBtn) {
            changePasswordSubmitBtn.disabled = false;
            changePasswordSubmitBtn.textContent = "保存密码";
          }
          return;
        }

        closeChangePasswordModal();
        showAppStatus("密码修改成功。", "ok");
      });
    }

    if (editProfileBtn) {
      editProfileBtn.addEventListener("click", () => {
        openAccountantProfileEditFlow();
      });
    }

    loginCodeInput.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      loginAccount(loginCodeInput.value, loginPasswordInput.value);
    });

    loginPasswordInput.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      loginAccount(loginCodeInput.value, loginPasswordInput.value);
    });

    if (openAccountantRegisterBtn) {
      openAccountantRegisterBtn.addEventListener("click", () => {
        accountantRegisterReturnTarget = "accountant-modal";
        openAccountantRegisterModal();
      });
    }

    savedLoginList.addEventListener("click", (event) => {
      const trigger = event.target.closest(".saved-login-item");
      if (!trigger) return;
      const savedLoginKey = String(trigger.dataset.savedLoginKey || "").trim();
      if (!savedLoginKey) return;
      const entry = savedLoginEntries.find((item) => getSavedLoginEntryKey(item.account) === savedLoginKey);
      if (!entry) return;
      loginAccount(entry.account, entry.password);
    });

    openCreateModalBtn.addEventListener("click", () => {
      openCreateModal();
    });

    openAnalysisModalBtn.addEventListener("click", () => {
      openAnalysisModal();
    });

    openAccountantModalBtn.addEventListener("click", async () => {
      await openAccountantModal();
    });

    openRecycleModalBtn.addEventListener("click", async () => {
      await openRecycleModal();
    });

    if (bossSettlementBtn) {
      bossSettlementBtn.addEventListener("click", () => {
        openBossSettlementSummaryModal();
      });
    }

    if (bossSettlementDetailBtn) {
      bossSettlementDetailBtn.addEventListener("click", () => {
        openBossSettlementDetailModal();
      });
    }

    if (devTodoForm) {
      devTodoForm.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!devTodoInput) return;
        const saved = addDevTodoItem(devTodoInput.value);
        if (!saved) {
          devTodoInput.focus();
          return;
        }
        devTodoInput.value = "";
        renderDevTodoList();
        devTodoInput.focus();
      });
    }

    if (devTodoList) {
      devTodoList.addEventListener("click", (event) => {
        const deleteBtn = event.target.closest(".dev-todo-item-delete");
        if (!deleteBtn) return;
        const todoId = String(deleteBtn.dataset.todoId || "").trim();
        if (!todoId) return;
        removeDevTodoItemById(todoId);
        renderDevTodoList();
      });
    }

    paymentPriceInput.addEventListener("input", () => {
      syncPremiumPriceFromPrices();
    });

    totalPriceInput.addEventListener("input", () => {
      syncPremiumPriceFromPrices();
      syncSettlementPriceFromTotal();
    });

    settlementPriceInput.addEventListener("input", () => {
      settlementPriceAutoFilled = false;
    });

    if (
      completeFeedbackImageSelectBtn
      && completeFeedbackImageInput
      && completeFeedbackUploader
      && completeFeedbackImageList
    ) {
      completeFeedbackImageSelectBtn.addEventListener("click", (event) => {
        if (isCompleteModalViewMode()) return;
        event.preventDefault();
        event.stopPropagation();
        completeFeedbackImageInput.click();
      });

      completeFeedbackUploader.addEventListener("click", (event) => {
        if (isCompleteModalViewMode()) return;
        if (event.target.closest(".feedback-image-remove-btn")) return;
        completeFeedbackImageInput.click();
      });

      completeFeedbackUploader.addEventListener("keydown", (event) => {
        if (isCompleteModalViewMode()) return;
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        completeFeedbackImageInput.click();
      });

      completeFeedbackImageInput.addEventListener("change", async () => {
        if (isCompleteModalViewMode()) return;
        await appendCompleteFeedbackFiles(completeFeedbackImageInput.files);
        completeFeedbackImageInput.value = "";
      });

      completeFeedbackUploader.addEventListener("dragenter", (event) => {
        if (isCompleteModalViewMode()) return;
        event.preventDefault();
        setCompleteFeedbackUploaderDragging(true);
      });

      completeFeedbackUploader.addEventListener("dragover", (event) => {
        if (isCompleteModalViewMode()) return;
        event.preventDefault();
        setCompleteFeedbackUploaderDragging(true);
      });

      completeFeedbackUploader.addEventListener("dragleave", (event) => {
        if (isCompleteModalViewMode()) return;
        event.preventDefault();
        const relatedTarget = event.relatedTarget;
        if (relatedTarget instanceof Node && completeFeedbackUploader.contains(relatedTarget)) return;
        setCompleteFeedbackUploaderDragging(false);
      });

      completeFeedbackUploader.addEventListener("drop", async (event) => {
        if (isCompleteModalViewMode()) return;
        event.preventDefault();
        setCompleteFeedbackUploaderDragging(false);
        const files = event.dataTransfer ? event.dataTransfer.files : null;
        await appendCompleteFeedbackFiles(files);
      });

      completeFeedbackImageList.addEventListener("click", (event) => {
        if (isCompleteModalViewMode()) return;
        const removeBtn = event.target.closest(".feedback-image-remove-btn");
        if (!removeBtn) return;
        event.preventDefault();
        event.stopPropagation();
        removeCompleteFeedbackImageItem(removeBtn.dataset.feedbackImageId);
      });
    }

    if (bossSettlementSummarySubmitBtn) {
      bossSettlementSummarySubmitBtn.addEventListener("click", async () => {
        await submitBossSettlementSelection();
      });
    }

    accountantPicker.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    sourcePicker.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    platformShopPicker.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    accountantPickerTrigger.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleAccountantPicker();
    });

    sourcePickerTrigger.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleSourcePicker();
    });

    platformShopPickerTrigger.addEventListener("click", (event) => {
      event.stopPropagation();
      togglePlatformShopPicker();
    });

    accountantPickerTrigger.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openAccountantPicker();
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        openAccountantPicker({ focusLastOption: true });
      }
    });

    sourcePickerTrigger.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openSourcePicker();
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        openSourcePicker({ focusLastOption: true });
      }
    });

    platformShopPickerTrigger.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openPlatformShopPicker();
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        openPlatformShopPicker({ focusLastOption: true });
      }
    });

    accountantPickerSearch.addEventListener("input", () => {
      renderAccountantPickerList(accountantPickerSearch.value);
    });

    accountantPickerSearch.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeAccountantPicker({ focusTrigger: true });
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        const optionButtons = getAccountantPickerOptionButtons();
        if (optionButtons.length) optionButtons[0].focus();
      }
    });

    accountantPickerList.addEventListener("keydown", (event) => {
      const optionButtons = getAccountantPickerOptionButtons();
      if (!optionButtons.length) return;
      const currentButton = event.target.closest(".accountant-picker-option");
      if (!currentButton) return;
      const currentIndex = optionButtons.indexOf(currentButton);
      if (currentIndex < 0) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        const nextIndex = Math.min(optionButtons.length - 1, currentIndex + 1);
        optionButtons[nextIndex].focus();
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        if (currentIndex === 0) {
          accountantPickerSearch.focus();
          return;
        }
        optionButtons[currentIndex - 1].focus();
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        closeAccountantPicker({ focusTrigger: true });
      }
    });

    sourcePickerList.addEventListener("keydown", (event) => {
      const optionButtons = getSourcePickerOptionButtons();
      if (!optionButtons.length) return;
      const currentButton = event.target.closest(".accountant-picker-option");
      if (!currentButton) return;
      const currentIndex = optionButtons.indexOf(currentButton);
      if (currentIndex < 0) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        const nextIndex = Math.min(optionButtons.length - 1, currentIndex + 1);
        optionButtons[nextIndex].focus();
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        if (currentIndex === 0) {
          sourcePickerTrigger.focus();
          return;
        }
        optionButtons[currentIndex - 1].focus();
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        closeSourcePicker({ focusTrigger: true });
      }
    });

    platformShopPickerList.addEventListener("keydown", (event) => {
      const optionButtons = getPlatformShopPickerOptionButtons();
      if (!optionButtons.length) return;
      const currentButton = event.target.closest(".accountant-picker-option");
      if (!currentButton) return;
      const currentIndex = optionButtons.indexOf(currentButton);
      if (currentIndex < 0) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        const nextIndex = Math.min(optionButtons.length - 1, currentIndex + 1);
        optionButtons[nextIndex].focus();
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        if (currentIndex === 0) {
          platformShopPickerTrigger.focus();
          return;
        }
        optionButtons[currentIndex - 1].focus();
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        closePlatformShopPicker({ focusTrigger: true });
      }
    });

    accountantPickerList.addEventListener("click", (event) => {
      const optionButton = event.target.closest(".accountant-picker-option");
      if (!optionButton) return;
      const nextValue = String(optionButton.dataset.value || "").trim();
      setAccountantPickerValue(nextValue);
      clearInlineFieldError(accountantPickerTrigger);
      if (!recordForm.querySelector(".field-validation-group-error")) {
        setRecordFormHint("", "idle");
      }
      renderAccountantPickerList(accountantPickerSearch.value);
      closeAccountantPicker({ focusTrigger: true });
    });

    sourcePickerList.addEventListener("click", (event) => {
      const optionButton = event.target.closest(".accountant-picker-option");
      if (!optionButton) return;
      const nextValue = String(optionButton.dataset.value || "").trim();
      setSourcePickerValue(nextValue, { autoFilled: false });
      clearInlineFieldError(sourcePickerTrigger);
      if (!recordForm.querySelector(".field-validation-group-error")) {
        setRecordFormHint("", "idle");
      }
      renderSourcePickerList();
      closeSourcePicker({ focusTrigger: true });
    });

    platformShopPickerList.addEventListener("click", (event) => {
      const optionButton = event.target.closest(".accountant-picker-option");
      if (!optionButton) return;
      const nextValue = String(optionButton.dataset.value || "").trim();
      setPlatformShopPickerValue(nextValue);
      clearInlineFieldError(platformShopPickerTrigger);
      if (!recordForm.querySelector(".field-validation-group-error")) {
        setRecordFormHint("", "idle");
      }
      renderPlatformShopPickerList();
      closePlatformShopPicker({ focusTrigger: true });
    });

    dispatcherTagButtons.forEach((button) => {
      button.addEventListener("click", () => {
        setDispatcherTag(button.dataset.dispatcherTag || "1");
      });
    });

    sortableHeaders.forEach((button) => {
      button.addEventListener("click", () => {
        toggleSort(button.dataset.key || "");
      });
    });

    filterMonthBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleFilterPopover("month");
    });

    filterDispatcherBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleFilterPopover("dispatcher");
    });

    filterAccountantBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleFilterPopover("accountant");
    });

    filterPlatformBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleFilterPopover("platform");
    });

    filterShopBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleFilterPopover("shopName");
    });

    filterSourceBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleFilterPopover("source");
    });

    filterStatusBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleFilterPopover("status");
    });

    filterSettledBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleFilterPopover("settled");
    });

    filterMonthPopover.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    filterDispatcherPopover.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    filterAccountantPopover.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    filterPlatformPopover.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    filterShopPopover.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    filterSourcePopover.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    filterStatusPopover.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    filterSettledPopover.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    filterMonthList.addEventListener("click", (event) => {
      const target = event.target.closest(".filter-option-btn");
      if (!target) return;
      const selected = target.dataset.filterValue || "";
      const nextMonth = filterState.month === selected ? "" : selected;
      clearDateFilterState();
      filterState.month = nextMonth;
      closeAllFilterPopovers();
      renderTable();
    });

    if (filterDateRangeApplyBtn) {
      filterDateRangeApplyBtn.addEventListener("click", () => {
        applyDateRangeFilter();
        closeAllFilterPopovers();
        renderTable();
      });
    }

    if (filterDateRangeClearBtn) {
      filterDateRangeClearBtn.addEventListener("click", () => {
        clearDateFilterState();
        closeAllFilterPopovers();
        renderTable();
      });
    }

    const handleDateRangeInputKeydown = (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      applyDateRangeFilter();
      closeAllFilterPopovers();
      renderTable();
    };

    if (filterDateStartInput) {
      filterDateStartInput.addEventListener("keydown", handleDateRangeInputKeydown);
    }

    if (filterDateEndInput) {
      filterDateEndInput.addEventListener("keydown", handleDateRangeInputKeydown);
    }

    filterDispatcherList.addEventListener("click", (event) => {
      const target = event.target.closest(".filter-option-btn");
      if (!target) return;
      const selected = target.dataset.filterValue || "";
      filterState.dispatcher = filterState.dispatcher === selected ? "" : selected;
      closeAllFilterPopovers();
      renderTable();
    });

    filterAccountantList.addEventListener("click", (event) => {
      const target = event.target.closest(".filter-option-btn");
      if (!target) return;
      const selected = target.dataset.filterValue || "";
      filterState.accountant = filterState.accountant === selected ? "" : selected;
      closeAllFilterPopovers();
      renderTable();
    });

    filterPlatformList.addEventListener("click", (event) => {
      const target = event.target.closest(".filter-option-btn");
      if (!target) return;
      const selected = target.dataset.filterValue || "";
      filterState.platform = filterState.platform === selected ? "" : selected;
      closeAllFilterPopovers();
      renderTable();
    });

    filterShopList.addEventListener("click", (event) => {
      const target = event.target.closest(".filter-option-btn");
      if (!target) return;
      const selected = target.dataset.filterValue || "";
      filterState.shopName = filterState.shopName === selected ? "" : selected;
      closeAllFilterPopovers();
      renderTable();
    });

    filterSourceList.addEventListener("click", (event) => {
      const target = event.target.closest(".filter-option-btn");
      if (!target) return;
      const selected = target.dataset.filterValue || "";
      filterState.source = filterState.source === selected ? "" : selected;
      closeAllFilterPopovers();
      renderTable();
    });

    filterStatusList.addEventListener("click", (event) => {
      const target = event.target.closest(".filter-option-btn");
      if (!target) return;
      const selected = target.dataset.filterValue || "";
      filterState.status = filterState.status === selected ? "" : selected;
      closeAllFilterPopovers();
      renderTable();
    });

    filterSettledList.addEventListener("click", (event) => {
      const target = event.target.closest(".filter-option-btn");
      if (!target) return;
      const selected = target.dataset.filterValue || "";
      filterState.settled = filterState.settled === selected ? "" : selected;
      closeAllFilterPopovers();
      renderTable();
    });

    clearFilterBtn.addEventListener("click", () => {
      clearDateFilterState();
      filterState.dispatcher = "";
      filterState.accountant = "";
      filterState.platform = "";
      filterState.shopName = "";
      filterState.source = "";
      filterState.status = "";
      filterState.settled = "";
      closeAllFilterPopovers();
      renderTable();
    });

    if (accountantForm) {
      accountantForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const username = String(accountantUsernameInput?.value || "").trim();
        const displayName = String(accountantNameInput?.value || "").trim();
        if (!username) {
          accountantUsernameInput?.focus();
          return;
        }
        if (!displayName) {
          accountantNameInput?.focus();
          return;
        }
        try {
          await createAccountant(username, displayName);
        } catch (error) {
          console.error(error);
          if (!username) {
            accountantUsernameInput?.focus();
          } else {
            accountantNameInput?.focus();
          }
          return;
        }
        if (accountantUsernameInput) accountantUsernameInput.value = "";
        if (accountantNameInput) accountantNameInput.value = "";
        accountantUsernameInput?.focus();
      });
    }

    if (accountantRegisterForm) {
      accountantRegisterForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const password = String(accountantRegisterPasswordInput?.value || "").trim();
        const alias = String(accountantRegisterAliasInput?.value || "").trim();
        const realName = String(accountantRegisterRealNameInput?.value || "").trim();
        const phone = String(accountantRegisterPhoneInput?.value || "").trim();
        const requiredFields = [
          {
            value: phone,
            input: accountantRegisterPhoneInput,
            message: "请输入手机号。"
          },
          {
            value: password,
            input: accountantRegisterPasswordInput,
            message: "请输入密码。"
          },
          {
            value: alias,
            input: accountantRegisterAliasInput,
            message: "请输入别名。"
          },
          {
            value: realName,
            input: accountantRegisterRealNameInput,
            message: "请输入姓名。"
          }
        ];
        const firstMissingField = requiredFields.find((field) => !field.value);
        if (firstMissingField) {
          showInlineFormError({
            form: accountantRegisterForm,
            hintSetter: setAccountantRegisterHint,
            target: firstMissingField.input,
            message: firstMissingField.message
          });
          return;
        }

        setAccountantRegisterHint("新增会计中...", "pending");
        if (accountantRegisterSubmitBtn) {
          accountantRegisterSubmitBtn.disabled = true;
          accountantRegisterSubmitBtn.textContent = "新增中...";
        }

        try {
          await registerAccountantProfile({
            password,
            alias,
            realName,
            phone
          });
        } catch (error) {
          console.error(error);
          const message = error.message || "新增会计失败";
          showInlineFormError({
            form: accountantRegisterForm,
            hintSetter: setAccountantRegisterHint,
            target: getAccountantRegisterErrorTarget(message),
            message
          });
          if (accountantRegisterSubmitBtn) {
            accountantRegisterSubmitBtn.disabled = false;
            accountantRegisterSubmitBtn.textContent = "确认新增";
          }
          return;
        }

        resetAccountantRegisterForm();
        await restoreAccountantModalAfterRegister({
          hintText: "新增会计成功",
          hintState: "ok"
        });
      });
    }

    if (accountantEditForm) {
      accountantEditForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const originalUsername = String(accountantEditOriginalUsernameInput?.value || editingAccountantUsername || "").trim();
        const password = String(accountantEditPasswordInput?.value || "").trim();
        const alias = String(accountantEditAliasInput?.value || "").trim();
        const realName = String(accountantEditRealNameInput?.value || "").trim();
        const phone = String(accountantEditPhoneInput?.value || "").trim();
        const canEditSensitiveFields = canEditAccountantSensitiveFields(accountantEditMode);

        if (!originalUsername) {
          closeAccountantEditModal();
          return;
        }
        if (canEditSensitiveFields && !password) {
          showInlineFormError({
            form: accountantEditForm,
            hintSetter: setAccountantEditHint,
            target: accountantEditPasswordInput,
            message: "请输入密码。"
          });
          return;
        }
        if (canEditSensitiveFields && !phone) {
          showInlineFormError({
            form: accountantEditForm,
            hintSetter: setAccountantEditHint,
            target: accountantEditPhoneInput,
            message: "请输入登录手机号。"
          });
          return;
        }

        setAccountantEditHint(accountantEditMode === "self" ? "个人信息与密码保存中..." : "修改提交中...", "pending");
        if (accountantEditSubmitBtn) {
          accountantEditSubmitBtn.disabled = true;
          accountantEditSubmitBtn.textContent = "提交中...";
        }

        try {
          const payload = {
            alias,
            realName
          };
          if (canEditSensitiveFields) {
            payload.password = password;
            payload.phone = phone;
          }
          await updateAccountantProfile(originalUsername, payload);
        } catch (error) {
          console.error(error);
          const message = error.message || "修改失败";
          showInlineFormError({
            form: accountantEditForm,
            hintSetter: setAccountantEditHint,
            target: getAccountantEditErrorTarget(message, accountantEditMode),
            message
          });
          if (accountantEditSubmitBtn) {
            accountantEditSubmitBtn.disabled = false;
            accountantEditSubmitBtn.textContent = "保存修改";
          }
          return;
        }

        closeAccountantEditModal();
      });
    }

    checkForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!requireAccount()) return;
      if (!isAccountantLogin()) return;
      const recordId = String(checkRecordIdInput.value || "").trim();
      if (!recordId) return;
      const customer = String(checkCustomerInput.value || "").trim();
      const summary = String(checkSummaryInput.value || "").trim();
      if (!customer) {
        showInlineFormError({
          form: checkForm,
          hintSetter: setCheckFormHint,
          target: checkCustomerInput,
          message: "客户为必填项。"
        });
        return;
      }
      if (!summary) {
        showInlineFormError({
          form: checkForm,
          hintSetter: setCheckFormHint,
          target: checkSummaryInput,
          message: "任务简介为必填项。"
        });
        return;
      }
      const payload = {
        customer,
        summary
      };
      try {
        await checkRecordById(recordId, payload);
      } catch (error) {
        console.error(error);
        const message = error.message || "确认失败，请稍后重试。";
        showInlineFormError({
          form: checkForm,
          hintSetter: setCheckFormHint,
          target: getCheckFormErrorTarget(message),
          message
        });
        return;
      }
      closeCheckModal();
    });

    completeForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (isCompleteModalViewMode()) {
        closeCompleteModal();
        return;
      }
      if (!requireAccount()) return;
      if (!isAccountantLogin()) return;
      const recordId = String(completeRecordIdInput.value || "").trim();
      if (!recordId) return;
      const completedAtRaw = String(completeTimeInput.value || "").trim();
      const customerFeedback = String(completeCustomerFeedbackInput.value || "").trim();
      if (!completedAtRaw) {
        showInlineFormError({
          form: completeForm,
          hintSetter: setCompleteFormHint,
          target: completeTimeInput,
          message: "完工时间为必填项。"
        });
        return;
      }
      const completedAt = toISOStringFromDateTimeLocal(completedAtRaw);
      if (!completedAt) {
        showInlineFormError({
          form: completeForm,
          hintSetter: setCompleteFormHint,
          target: completeTimeInput,
          message: "完工时间格式无效。"
        });
        return;
      }
      try {
        await checkRecordById(recordId, {
          status: "completed",
          completedAt,
          customerFeedback,
          serviceFeedbackImages: getCompleteFeedbackImagePayload()
        });
      } catch (error) {
        console.error(error);
        const message = error.message || "状态更新失败，请稍后重试。";
        showInlineFormError({
          form: completeForm,
          hintSetter: setCompleteFormHint,
          target: getCompleteFormErrorTarget(message),
          message
        });
        return;
      }
      closeCompleteModal();
    });

    accountantList.addEventListener("click", async (event) => {
      const editBtn = event.target.closest(".accountant-edit-btn");
      if (editBtn) {
        const accountantUsername = String(editBtn.dataset.accountantUsername || "").trim();
        if (!accountantUsername) return;
        const targetProfile = accountants.find(
          (item) => String(item.username || item.name || "").trim() === accountantUsername
        ) || null;
        if (!targetProfile) return;
        openAccountantEditModal(targetProfile);
        return;
      }

      const deleteBtn = event.target.closest(".accountant-delete-btn");
      if (!deleteBtn) return;
      const accountantUsername = String(deleteBtn.dataset.accountantUsername || "").trim();
      const accountantDisplayName = String(deleteBtn.dataset.accountantDisplayName || "").trim();
      if (!accountantUsername || !accountantDisplayName) return;
      const relatedCount = Number(deleteBtn.dataset.relatedCount || 0);
      if (relatedCount > 0) {
        setAccountantModalHint(`会计“${accountantDisplayName}”有 ${relatedCount} 条数据，先处理数据后再删除。`, "error");
        return;
      }
      const confirmed = await openConfirmDialog({
        title: "删除会计",
        message: `确认删除会计“${accountantDisplayName}”？`,
        confirmText: "确认删除",
        tone: "danger"
      });
      if (!confirmed) return;
      try {
        await deleteAccountant(accountantUsername);
      } catch (error) {
        console.error(error);
        setAccountantModalHint(error.message || "删除会计失败，请稍后重试。", "error");
      }
    });

    if (tableSelectAllCheckbox) {
      tableSelectAllCheckbox.addEventListener("change", () => {
        if (!requireAccount()) return;
        if (!canCurrentAccountSettleRecords()) return;
        setBossRecordSelectionForRecords(getSortedRecords(getFilteredRecords()), tableSelectAllCheckbox.checked);
        renderTable();
      });
    }

    if (exportTableBtn) {
      exportTableBtn.addEventListener("click", () => {
        if (!requireAccount()) return;
        if (!isBossLogin()) return;
        exportCurrentTableRecords();
      });
    }

    if (accountantInvoiceUploadBtn && accountantInvoiceImageInput) {
      accountantInvoiceUploadBtn.addEventListener("click", () => {
        if (!requireAccount()) return;
        if (!isAccountantLogin()) return;
        const targetRecords = getAccountantInvoiceUploadTargetRecords(records);
        if (!targetRecords.length) {
          updateAccountantInvoiceUploadControls();
          return;
        }
        accountantInvoiceImageInput.click();
      });

      accountantInvoiceImageInput.addEventListener("change", async () => {
        const file = accountantInvoiceImageInput.files && accountantInvoiceImageInput.files[0]
          ? accountantInvoiceImageInput.files[0]
          : null;
        accountantInvoiceImageInput.value = "";
        if (!file) return;
        if (!String(file.type || "").toLowerCase().startsWith("image/")) {
          showAppStatus("只支持图片文件。");
          return;
        }
        if (Number(file.size || 0) > SETTLEMENT_INVOICE_IMAGE_MAX_SIZE_BYTES) {
          showAppStatus(`发票图片“${file.name || "未命名图片"}”超过 5MB。`);
          return;
        }

        isInvoiceUploadSubmitting = true;
        updateAccountantInvoiceUploadControls();
        try {
          const dataUrl = await readFileAsDataUrl(file);
          const result = await uploadSettlementInvoice({
            name: String(file.name || "").trim(),
            dataUrl
          });
          const count = result.uploadedRecordIds.length;
          showAppStatus(
            count
              ? `发票已上传，已更新 ${count} 条状态为${getRecordWorkflowStatusLabelByKey("uploaded")}的数据。`
              : "发票已上传。",
            "ok"
          );
        } catch (error) {
          console.error(error);
          showAppStatus(error.message || "发票上传失败，请稍后重试。");
        } finally {
          isInvoiceUploadSubmitting = false;
          updateAccountantInvoiceUploadControls();
        }
      });
    }

    tableBody.addEventListener("change", (event) => {
      const selectCheckbox = event.target.closest(".row-select-checkbox");
      if (!selectCheckbox) return;
      if (!requireAccount()) return;
      if (!canCurrentAccountSettleRecords()) return;
      const recordId = String(selectCheckbox.dataset.recordId || "").trim();
      if (!recordId) return;
      setBossRecordSelected(recordId, selectCheckbox.checked);
      const targetRow = selectCheckbox.closest("tr");
      if (targetRow) {
        targetRow.classList.toggle("boss-selected-row", selectCheckbox.checked);
      }
      updateBossSettlementControls(getSortedRecords(getFilteredRecords()));
    });

    if (invoiceSummaryList) {
      invoiceSummaryList.addEventListener("click", (event) => {
        const invoiceThumb = event.target.closest(".invoice-summary-thumb");
        if (!invoiceThumb) return;
        if (!requireAccount()) return;
        const recordId = String(invoiceThumb.dataset.recordId || "").trim();
        if (!recordId) return;
        const targetRecord = records.find((item) => String(item.id || "").trim() === recordId) || null;
        if (!targetRecord) return;
        openInvoicePreviewModal(targetRecord);
      });
    }

    tableBody.addEventListener("click", async (event) => {
      const dismissHighlightBtn = event.target.closest(".row-update-dismiss-btn");
      if (dismissHighlightBtn) {
        if (!requireAccount()) return;
        const recordId = String(dismissHighlightBtn.dataset.recordDismissHighlight || "").trim();
        if (!recordId) return;
        dismissUpdatedRowHighlight(recordId);
        renderTable();
        return;
      }

      const checkBtn = event.target.closest(".row-check-btn");
      if (checkBtn) {
        if (!requireAccount()) return;
        if (checkBtn.disabled) return;
        const recordId = String(checkBtn.dataset.recordId || "").trim();
        if (!recordId) return;
        const checkAction = String(checkBtn.dataset.checkAction || "").trim();
        const targetRecord = records.find((item) => String(item.id || "").trim() === recordId) || null;
        if (!targetRecord) return;
        if (!isAccountantLogin()) return;
        if (checkAction === "complete") {
          openCompleteModal(targetRecord);
          return;
        }
        if (checkAction !== "verify") return;
        openCheckModal(targetRecord);
        return;
      }

      const editBtn = event.target.closest(".row-edit-btn");
      if (editBtn) {
        if (!requireAccount()) return;
        const recordId = String(editBtn.dataset.recordId || "").trim();
        if (!recordId) return;
        const targetRecord = records.find((item) => String(item.id || "").trim() === recordId) || null;
        if (!targetRecord) return;
        openEditModal(targetRecord);
        return;
      }

      const historyBtn = event.target.closest(".row-history-btn");
      if (historyBtn) {
        if (!requireAccount()) return;
        const recordId = String(historyBtn.dataset.recordId || "").trim();
        if (!recordId) return;
        const targetRecord = records.find((item) => String(item.id || "").trim() === recordId) || null;
        if (!targetRecord) return;
        dismissUpdatedRowHighlight(recordId);
        renderTable();
        openRecordHistoryModal(targetRecord);
        return;
      }

      const deleteBtn = event.target.closest(".row-delete-btn");
      if (!deleteBtn) return;
      if (!requireAccount()) return;
      if (isAccountantLogin()) return;

      const recordId = String(deleteBtn.dataset.recordId || "").trim();
      if (!recordId) return;
      const customer = String(deleteBtn.dataset.customer || "").trim() || "未填";
      const date = String(deleteBtn.dataset.date || "").trim() || "未知日期";
      const confirmed = await openConfirmDialog({
        title: "删除数据",
        message: `确认删除该条数据？\n日期：${date}\n客户：${customer}`,
        confirmText: "确认删除",
        tone: "danger"
      });
      if (!confirmed) return;

      try {
        await deleteRecordById(recordId);
      } catch (error) {
        console.error(error);
        showAppStatus(error.message || "删除失败，请稍后重试。");
      }
    });

    createModal.addEventListener("click", (event) => {
      if (event.target === createModal) {
        closeCreateModal();
      }
    });

    checkModal.addEventListener("click", (event) => {
      if (event.target === checkModal) {
        closeCheckModal();
      }
    });

    completeModal.addEventListener("click", (event) => {
      if (event.target === completeModal) {
        closeCompleteModal();
      }
    });

    returnPriceModal.addEventListener("click", (event) => {
      if (event.target === returnPriceModal) {
        closeReturnPriceModal();
      }
    });

    if (recordHistoryModal) {
      recordHistoryModal.addEventListener("click", (event) => {
        if (event.target === recordHistoryModal) {
          closeRecordHistoryModal();
        }
      });
    }

    if (invoicePreviewModal) {
      invoicePreviewModal.addEventListener("click", (event) => {
        if (event.target === invoicePreviewModal) {
          closeInvoicePreviewModal();
        }
      });
    }

    if (bossSettlementSummaryModal) {
      bossSettlementSummaryModal.addEventListener("click", (event) => {
        if (event.target === bossSettlementSummaryModal) {
          closeBossSettlementSummaryModal();
        }
      });
    }

    if (bossSettlementDetailModal) {
      bossSettlementDetailModal.addEventListener("click", (event) => {
        if (event.target === bossSettlementDetailModal) {
          closeBossSettlementDetailModal();
        }
      });
    }

    analysisModal.addEventListener("click", (event) => {
      if (event.target === analysisModal) {
        closeAnalysisModal();
      }
    });

    accountantModal.addEventListener("click", (event) => {
      if (event.target === accountantModal) {
        closeAccountantModal();
      }
    });

    if (accountantRegisterModal) {
      accountantRegisterModal.addEventListener("click", (event) => {
        if (event.target === accountantRegisterModal) {
          void restoreAccountantModalAfterRegister();
        }
      });
    }

    if (accountantEditModal) {
      accountantEditModal.addEventListener("click", (event) => {
        if (event.target === accountantEditModal) {
          closeAccountantEditModal();
        }
      });
    }

    recycleModal.addEventListener("click", (event) => {
      if (event.target === recycleModal) {
        closeRecycleModal();
      }
    });

    recycleTableBody.addEventListener("click", async (event) => {
      const trigger = event.target.closest("[data-recycle-restore-id]");
      if (!trigger) return;
      if (isAccountantLogin()) return;
      const recycleId = String(trigger.dataset.recycleRestoreId || "").trim();
      if (!recycleId || trigger.disabled) return;

      const originalText = trigger.textContent;
      trigger.disabled = true;
      trigger.textContent = "还原中";

      try {
        await restoreRecycleBinRecordById(recycleId);
      } catch (error) {
        console.error(error);
        setRecycleModalHint(error.message || "还原失败，请稍后重试。", "error");
      } finally {
        if (trigger.isConnected) {
          trigger.disabled = false;
          trigger.textContent = originalText;
        }
      }
    });

    if (devTodoModal) {
      devTodoModal.addEventListener("click", (event) => {
        if (event.target === devTodoModal) {
          closeDevTodoModal();
        }
      });
    }

    if (changePasswordModal) {
      changePasswordModal.addEventListener("click", (event) => {
        if (event.target === changePasswordModal) {
          closeChangePasswordModal();
        }
      });
    }

    if (confirmModal) {
      confirmModal.addEventListener("click", (event) => {
        if (event.target === confirmModal) {
          closeConfirmDialog(false);
        }
      });
    }

    if (confirmModalCancelBtn) {
      confirmModalCancelBtn.addEventListener("click", () => {
        closeConfirmDialog(false);
      });
    }

    if (confirmModalConfirmBtn) {
      confirmModalConfirmBtn.addEventListener("click", () => {
        closeConfirmDialog(true);
      });
    }

    document.addEventListener("click", () => {
      closeAllFilterPopovers();
      closeAccountantPicker();
      closeSourcePicker();
      closePlatformShopPicker();
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) return;
      triggerImmediateAutoRefresh();
    });

    window.addEventListener("focus", () => {
      triggerImmediateAutoRefresh();
    });

    window.addEventListener("storage", (event) => {
      if (!isDevTodoEnabled) return;
      if (event.storageArea !== window.localStorage) return;
      if (event.key !== STORAGE_KEY_DEV_TODO_ITEMS) return;
      loadDevTodoItems();
      renderDevTodoList();
    });

    document.addEventListener("keydown", (event) => {
      if (!filterMonthPopover.hidden
        || !filterDispatcherPopover.hidden
        || !filterAccountantPopover.hidden
        || !filterPlatformPopover.hidden
        || !filterShopPopover.hidden
        || !filterSourcePopover.hidden
        || !filterStatusPopover.hidden
        || !filterSettledPopover.hidden) {
        if (event.key === "Escape") {
          closeAllFilterPopovers();
          return;
        }
      }
      if (event.key === "Escape" && !accountantPickerDropdown.hidden) {
        closeAccountantPicker({ focusTrigger: true });
        return;
      }
      if (event.key === "Escape" && !sourcePickerDropdown.hidden) {
        closeSourcePicker({ focusTrigger: true });
        return;
      }
      if (event.key === "Escape" && !platformShopPickerDropdown.hidden) {
        closePlatformShopPicker({ focusTrigger: true });
        return;
      }
      if (event.key === "Escape" && !analysisModal.hidden) {
        closeAnalysisModal();
        return;
      }
      if (accountantRegisterModal && event.key === "Escape" && !accountantRegisterModal.hidden) {
        void restoreAccountantModalAfterRegister();
        return;
      }
      if (changePasswordModal && event.key === "Escape" && !changePasswordModal.hidden) {
        closeChangePasswordModal();
        return;
      }
      if (confirmModal && event.key === "Escape" && !confirmModal.hidden) {
        closeConfirmDialog(false);
        return;
      }
      if (accountantEditModal && event.key === "Escape" && !accountantEditModal.hidden) {
        closeAccountantEditModal();
        return;
      }
      if (event.key === "Escape" && !accountantModal.hidden) {
        closeAccountantModal();
        return;
      }
      if (event.key === "Escape" && !recycleModal.hidden) {
        closeRecycleModal();
        return;
      }
      if (devTodoModal && event.key === "Escape" && !devTodoModal.hidden) {
        closeDevTodoModal();
        return;
      }
      if (event.key === "Escape" && !recordHistoryModal.hidden) {
        closeRecordHistoryModal();
        return;
      }
      if (invoicePreviewModal && event.key === "Escape" && !invoicePreviewModal.hidden) {
        closeInvoicePreviewModal();
        return;
      }
      if (event.key === "Escape" && !returnPriceModal.hidden) {
        closeReturnPriceModal();
        return;
      }
      if (event.key === "Escape" && !bossSettlementSummaryModal.hidden) {
        closeBossSettlementSummaryModal();
        return;
      }
      if (bossSettlementDetailModal && event.key === "Escape" && !bossSettlementDetailModal.hidden) {
        closeBossSettlementDetailModal();
        return;
      }
      if (event.key === "Escape" && !completeModal.hidden) {
        closeCompleteModal();
        return;
      }
      if (event.key === "Escape" && !checkModal.hidden) {
        closeCheckModal();
        return;
      }
      if (event.key === "Escape" && !createModal.hidden) {
        closeCreateModal();
      }
    });

    recordForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!requireAccount()) return;

      const formData = new FormData(recordForm);
      const editingRecordId = String(recordEditingIdInput.value || "").trim();
      const currentAccountantName = isAccountantLogin() ? getCurrentAccountantDisplayName() : "";
      const paymentPriceRaw = String(formData.get("paymentPrice") || "").trim();
      const totalPriceRaw = String(formData.get("totalPrice") || "").trim();
      const settlementPriceRaw = String(formData.get("settlementPrice") || "").trim();
      const item = {
        date: String(formData.get("date") || dateInput.value || getTodayISODate()).trim(),
        isMonthlySettlement: Boolean(monthlySettlementCheckbox?.checked),
        dispatcher: dispatcherInput.value || getDefaultDispatcherTag(),
        accountant: currentAccountantName || String(formData.get("accountant") || "").trim(),
        platform: String(formData.get("platform") || "").trim(),
        shopName: String(formData.get("shopName") || "").trim(),
        orderNo: String(formData.get("orderNo") || "").trim(),
        source: String(formData.get("source") || "").trim(),
        customer: String(formData.get("customer") || "").trim(),
        summary: String(formData.get("summary") || "").trim(),
        paymentPrice: paymentPriceRaw === "" ? Number.NaN : Number(paymentPriceRaw),
        totalPrice: totalPriceRaw === "" ? Number.NaN : Number(totalPriceRaw),
        settlementPrice: settlementPriceRaw === "" ? Number.NaN : Number(settlementPriceRaw)
      };
      const isCreateMode = !editingRecordId;

      if (isCreateMode) {
        const requiredFields = [
          { key: "date", label: "日期", value: item.date },
          { key: "source", label: "来源", value: item.source },
          { key: "platform", label: "平台", value: item.platform },
          { key: "shopName", label: "店铺名", value: item.shopName },
          { key: "orderNo", label: "订单号", value: item.orderNo },
          { key: "customer", label: "客户", value: item.customer }
        ];
        const firstMissingField = requiredFields.find((field) => !String(field.value || "").trim());
        if (firstMissingField) {
          const target = firstMissingField.key === "date"
            ? dateInput
            : (firstMissingField.key === "source"
              ? sourcePickerTrigger
              : ((firstMissingField.key === "platform" || firstMissingField.key === "shopName")
                ? platformShopPickerTrigger
                : (firstMissingField.key === "orderNo" ? orderNoInput : customerInput)));
          const open = firstMissingField.key === "source"
            ? () => openSourcePicker()
            : ((firstMissingField.key === "platform" || firstMissingField.key === "shopName")
              ? () => openPlatformShopPicker()
              : null);
          showInlineFormError({
            form: recordForm,
            hintSetter: setRecordFormHint,
            target,
            message: `${firstMissingField.label}为必填项。`,
            open
          });
          return;
        }
      }

      const priceFields = [
        {
          label: "付款价",
          raw: paymentPriceRaw,
          value: item.paymentPrice,
          input: paymentPriceInput
        },
        {
          label: "会计价",
          raw: totalPriceRaw,
          value: item.totalPrice,
          input: totalPriceInput
        },
        {
          label: "结算价",
          raw: settlementPriceRaw,
          value: item.settlementPrice,
          input: settlementPriceInput
        }
      ];
      const invalidPriceField = priceFields.find((field) => (
        field.raw === "" || !Number.isFinite(field.value) || field.value < 0
      ));
      if (invalidPriceField) {
        showInlineFormError({
          form: recordForm,
          hintSetter: setRecordFormHint,
          target: invalidPriceField.input,
          message: invalidPriceField.raw === ""
            ? `${invalidPriceField.label}为必填项。`
            : `${invalidPriceField.label}格式无效。`
        });
        return;
      }

      if (!item.accountant) {
        showInlineFormError({
          form: recordForm,
          hintSetter: setRecordFormHint,
          target: accountantPickerTrigger,
          message: "会计为必填项。",
          open: () => openAccountantPicker()
        });
        return;
      }

      try {
        if (editingRecordId) {
          await updateRecordById(editingRecordId, item);
        } else {
          await createRecord({
            ...item,
            checkStatus: "pending"
          });
        }
      } catch (error) {
        console.error(error);
        const message = error.message || (editingRecordId ? "修改失败，请稍后重试。" : "保存失败，请稍后重试。");
        const { target, open } = getRecordFormErrorPresentation(message, customerInput);
        showInlineFormError({
          form: recordForm,
          hintSetter: setRecordFormHint,
          target,
          message,
          open
        });
        return;
      }

      recordForm.reset();
      applyAccountToForm();
      closeCreateModal();
    });

    recordReturnBtn.addEventListener("click", async () => {
      if (!requireAccount()) return;
      if (isAccountantLogin()) return;
      const editingRecordId = String(recordEditingIdInput.value || "").trim();
      if (!editingRecordId) return;

      const formData = new FormData(recordForm);
      const item = {
        date: String(formData.get("date") || dateInput.value || getTodayISODate()).trim(),
        isMonthlySettlement: Boolean(monthlySettlementCheckbox?.checked),
        dispatcher: dispatcherInput.value || getDefaultDispatcherTag(),
        accountant: String(formData.get("accountant") || "").trim(),
        platform: String(formData.get("platform") || "").trim(),
        shopName: String(formData.get("shopName") || "").trim(),
        orderNo: String(formData.get("orderNo") || "").trim(),
        source: String(formData.get("source") || "").trim(),
        customer: String(formData.get("customer") || "").trim(),
        summary: String(formData.get("summary") || "").trim(),
        paymentPrice: 0,
        totalPrice: 0,
        settlementPrice: 0,
        returnedPriceSnapshot: {
          paymentPrice: Number(formData.get("paymentPrice") || 0),
          totalPrice: Number(formData.get("totalPrice") || 0),
          premiumPrice: Number(formData.get("paymentPrice") || 0) - Number(formData.get("totalPrice") || 0),
          settlementPrice: Number(formData.get("settlementPrice") || 0)
        },
        status: "returned"
      };

      if (!item.accountant) {
        showInlineFormError({
          form: recordForm,
          hintSetter: setRecordFormHint,
          target: accountantPickerTrigger,
          message: "会计为必填项。",
          open: () => openAccountantPicker()
        });
        return;
      }

      try {
        await updateRecordById(editingRecordId, item);
      } catch (error) {
        console.error(error);
        const message = error.message || "退单失败，请稍后重试。";
        const { target, open } = getRecordFormErrorPresentation(message, customerInput);
        showInlineFormError({
          form: recordForm,
          hintSetter: setRecordFormHint,
          target,
          message,
          open
        });
        return;
      }

      recordForm.reset();
      applyAccountToForm();
      closeCreateModal();
    });

    async function init() {
      bindInlineValidation(loginPage, setLoginRequestHint);
      bindInlineValidation(recordForm, setRecordFormHint);
      bindInlineValidation(checkForm, setCheckFormHint);
      bindInlineValidation(completeForm, setCompleteFormHint);
      bindInlineValidation(accountantRegisterForm, setAccountantRegisterHint);
      bindInlineValidation(accountantEditForm, setAccountantEditHint);
      bindInlineValidation(changePasswordForm, setChangePasswordHint);
      initializeSuggestionGuard();
      closeCreateModal();
      closeCheckModal();
      closeCompleteModal();
      closeRecordHistoryModal();
      closeInvoicePreviewModal();
      closeAnalysisModal();
      closeAccountantModal();
      closeAccountantRegisterModal();
      closeChangePasswordModal();
      closeRecycleModal();
      closeDevTodoModal();
      setLoginRequestHint("", "idle");
      removePersistentStateItem(STORAGE_KEY_OPERATION_NOTICE_DISMISSED_LEGACY);
      syncDevTodoEntryPoint();
      loadDevTodoItems();
      renderDevTodoList();
      renderBuildInfo();
      void fetchBuildInfo();
      loadSavedLoginEntries();
      loadFromStorage();
      loadOperationNoticePreference();
      loadViewState();

      validateCurrentAccount();
      applyAccountToForm();
      renderSourcePickerOptions();
      renderPlatformShopPickerOptions();

      if (currentAccount) {
        loginCodeInput.value = "";
        loginPasswordInput.value = "";
        setPageMode(true);
        await syncDataAfterLogin();
      } else {
        stopAutoRefresh();
        setPageMode(false);
        loginCodeInput.value = "";
        loginPasswordInput.value = "";
        loginCodeInput.focus();
      }
    }

    init();
