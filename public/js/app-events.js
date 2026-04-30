// Events & Bootstrap: event bindings and app initialization lifecycle.
    if (loginForm) {
      loginForm.addEventListener("submit", (event) => {
        event.preventDefault();
        loginAccount(loginCodeInput.value, loginPasswordInput.value);
      });
    } else {
      enterBtn.addEventListener("click", () => {
        loginAccount(loginCodeInput.value, loginPasswordInput.value);
      });
    }

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

        try {
          setChangePasswordHint("密码保存中...", "pending");
          await withLoading(
            {
              button: changePasswordSubmitBtn,
              form: changePasswordForm,
              buttonText: "保存中..."
            },
            async () => {
              if (isDispatcherLogin()) {
                await changeDispatcherPassword(newPassword);
              } else {
                await changeAccountantPassword(accountName, newPassword);
              }
            }
          );
        } catch (error) {
          console.error(error);
          showInlineFormError({
            form: changePasswordForm,
            hintSetter: setChangePasswordHint,
            target: changePasswordInput,
            message: error.message || "修改密码失败，请稍后重试。"
          });
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

    if (openAccountantRegisterBtn) {
      openAccountantRegisterBtn.addEventListener("click", () => {
        openAccountantRegisterModal({ returnTarget: "accountant-modal" });
      });
    }

    if (closeAccountantModalBtn) {
      closeAccountantModalBtn.addEventListener("click", () => {
        closeAccountantModal();
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

    if (openDispatcherModalBtn) {
      openDispatcherModalBtn.addEventListener("click", async () => {
        await openDispatcherModal();
      });
    }

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

    accountantSortableHeaders.forEach((button) => {
      button.addEventListener("click", () => {
        toggleAccountantSort(button.dataset.key || "");
      });
    });

    function clearSingleFilter(key) {
      if (key === "month") {
        clearDateFilterState();
      }
      if (key === "dispatcher") filterState.dispatcher = "";
      if (key === "orderNo") {
        filterState.orderNo = "";
        if (filterOrderInput) filterOrderInput.value = "";
      }
      if (key === "accountant") filterState.accountant = "";
      if (key === "platform") filterState.platform = "";
      if (key === "shopName") filterState.shopName = "";
      if (key === "source") filterState.source = "";
      if (key === "status") filterState.status = "";
      if (key === "settled") filterState.settled = "";
      closeAllFilterPopovers();
      renderTable();
    }

    function hasSingleFilterValue(key) {
      if (key === "month") return hasDateFilterSelected();
      if (key === "dispatcher") return Boolean(filterState.dispatcher);
      if (key === "orderNo") return Boolean(filterState.orderNo);
      if (key === "accountant") return Boolean(filterState.accountant);
      if (key === "platform") return Boolean(filterState.platform);
      if (key === "shopName") return Boolean(filterState.shopName);
      if (key === "source") return Boolean(filterState.source);
      if (key === "status") return Boolean(filterState.status);
      if (key === "settled") return Boolean(filterState.settled);
      return false;
    }

    function handleFilterButtonClick(event, key) {
      event.preventDefault();
      event.stopPropagation();
      if (hasSingleFilterValue(key)) {
        clearSingleFilter(key);
        return;
      }
      toggleFilterPopover(key);
    }

    filterMonthBtn.addEventListener("click", (event) => handleFilterButtonClick(event, "month"));
    filterDispatcherBtn.addEventListener("click", (event) => handleFilterButtonClick(event, "dispatcher"));
    filterOrderBtn.addEventListener("click", (event) => handleFilterButtonClick(event, "orderNo"));
    filterAccountantBtn.addEventListener("click", (event) => handleFilterButtonClick(event, "accountant"));
    filterPlatformBtn.addEventListener("click", (event) => handleFilterButtonClick(event, "platform"));
    filterShopBtn.addEventListener("click", (event) => handleFilterButtonClick(event, "shopName"));
    filterSourceBtn.addEventListener("click", (event) => handleFilterButtonClick(event, "source"));
    filterStatusBtn.addEventListener("click", (event) => handleFilterButtonClick(event, "status"));
    filterSettledBtn.addEventListener("click", (event) => handleFilterButtonClick(event, "settled"));

    filterMonthPopover.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    filterDispatcherPopover.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    filterOrderPopover.addEventListener("click", (event) => {
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

    function applyOrderNoFilter(options = {}) {
      filterState.orderNo = String(filterOrderInput?.value || "").trim();
      if (options.closePopover) {
        closeAllFilterPopovers();
      }
      renderTable();
    }

    if (filterOrderInput) {
      filterOrderInput.addEventListener("input", () => {
        applyOrderNoFilter({ closePopover: false });
      });
      filterOrderInput.addEventListener("search", () => {
        applyOrderNoFilter({ closePopover: false });
      });
      filterOrderInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          closeAllFilterPopovers();
        }
        if (event.key === "Escape") {
          closeAllFilterPopovers();
        }
      });
    }

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
      filterState.orderNo = "";
      filterState.accountant = "";
      filterState.platform = "";
      filterState.shopName = "";
      filterState.source = "";
      filterState.status = "";
      filterState.settled = "";
      closeAllFilterPopovers();
      renderTable();
    });

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

        try {
          setAccountantRegisterHint("新增会计中...", "pending");
          await withLoading(
            {
              button: accountantRegisterSubmitBtn,
              form: accountantRegisterForm,
              buttonText: "新增中..."
            },
            () => registerAccountantProfile({
              password,
              alias,
              realName,
              phone
            })
          );
        } catch (error) {
          console.error(error);
          const message = error.message || "新增会计失败";
          showInlineFormError({
            form: accountantRegisterForm,
            hintSetter: setAccountantRegisterHint,
            target: getAccountantRegisterErrorTarget(message),
            message
          });
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

        try {
          const payload = {
            alias,
            realName
          };
          if (canEditSensitiveFields) {
            payload.password = password;
            payload.phone = phone;
          }
          setAccountantEditHint(accountantEditMode === "self" ? "个人信息与密码保存中..." : "修改提交中...", "pending");
          await withLoading(
            {
              button: accountantEditSubmitBtn,
              form: accountantEditForm,
              buttonText: "提交中..."
            },
            () => updateAccountantProfile(originalUsername, payload)
          );
        } catch (error) {
          console.error(error);
          const message = error.message || "修改失败";
          showInlineFormError({
            form: accountantEditForm,
            hintSetter: setAccountantEditHint,
            target: getAccountantEditErrorTarget(message, accountantEditMode),
            message
          });
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
        setCheckFormHint("提交确认中...", "pending");
        await withLoading(
          {
            button: checkFormSubmitBtn,
            form: checkForm,
            buttonText: "提交中..."
          },
          () => checkRecordById(recordId, payload)
        );
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
        setCompleteFormHint("确认完成中...", "pending");
        await withLoading(
          {
            button: completeModalSubmitBtn,
            form: completeForm,
            buttonText: "提交中..."
          },
          () => checkRecordById(recordId, {
            status: "completed",
            completedAt,
            customerFeedback
          })
        );
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

    function getRefundMoneyInputValue(input) {
      const raw = String(input?.value || "").trim();
      return raw === "" ? Number.NaN : Number(raw);
    }

    function showRefundMoneyError(target, message) {
      showInlineFormError({
        form: refundForm,
        hintSetter: setRefundFormHint,
        target,
        message
      });
    }

    function getRefundErrorTarget(message) {
      const text = String(message || "");
      if (text.includes("会计价、会计结算价")) return refundTotalPriceInput;
      if (text.includes("会计结算价") || text.includes("结算价")) return refundSettlementPriceInput;
      if (text.includes("会计价")) return refundTotalPriceInput;
      return refundPaymentPriceInput;
    }

    refundForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!requireAccount()) return;
      const recordId = String(refundRecordIdInput.value || "").trim();
      if (!recordId) return;
      const originalPaymentPrice = Number(refundPaymentPriceInput.dataset.originalPaymentPrice || Number.NaN);
      const originalTotalPrice = Number(refundTotalPriceInput.dataset.originalTotalPrice || Number.NaN);
      const originalSettlementPrice = Number(refundSettlementPriceInput.dataset.originalSettlementPrice || Number.NaN);
      const nextPaymentPrice = getRefundMoneyInputValue(refundPaymentPriceInput);
      const nextTotalPrice = getRefundMoneyInputValue(refundTotalPriceInput);
      const nextSettlementPrice = getRefundMoneyInputValue(refundSettlementPriceInput);
      if (isAccountantLogin()) {
        if (!Number.isFinite(nextTotalPrice) || nextTotalPrice < 0) {
          showRefundMoneyError(refundTotalPriceInput, "会计价格式无效。");
          return;
        }
        if (!Number.isFinite(nextSettlementPrice) || nextSettlementPrice < 0) {
          showRefundMoneyError(refundSettlementPriceInput, "会计结算价格式无效。");
          return;
        }
        if (!Number.isFinite(originalTotalPrice) || originalTotalPrice < 0) {
          showRefundMoneyError(refundTotalPriceInput, "当前会计价无效。");
          return;
        }
        if (!Number.isFinite(originalSettlementPrice) || originalSettlementPrice < 0) {
          showRefundMoneyError(refundSettlementPriceInput, "当前会计结算价无效。");
          return;
        }
        const originalTotalCents = Math.round(originalTotalPrice * 100);
        const originalSettlementCents = Math.round(originalSettlementPrice * 100);
        const nextTotalCents = Math.round(nextTotalPrice * 100);
        const nextSettlementCents = Math.round(nextSettlementPrice * 100);
        if (nextTotalCents > originalTotalCents) {
          showRefundMoneyError(refundTotalPriceInput, "会计价需要小于或等于当前会计价。");
          return;
        }
        if (nextSettlementCents > originalSettlementCents) {
          showRefundMoneyError(refundSettlementPriceInput, "会计结算价需要小于或等于当前会计结算价。");
          return;
        }
        if (nextTotalCents >= originalTotalCents && nextSettlementCents >= originalSettlementCents) {
          showRefundMoneyError(refundTotalPriceInput, "会计价、会计结算价至少一项需要小于原数据。");
          return;
        }
        try {
          setRefundFormHint("提交退款中...", "pending");
          const nextRefundStatus = nextTotalCents === 0 && nextSettlementCents === 0
            ? "refunded"
            : "partial_refunded";
          await withLoading(
            {
              button: refundFormSubmitBtn,
              form: refundForm,
              buttonText: "提交中..."
            },
            () => updateRecordById(recordId, {
              refundStatus: nextRefundStatus,
              totalPrice: nextTotalPrice,
              settlementPrice: nextSettlementPrice
            })
          );
        } catch (error) {
          console.error(error);
          const message = error.message || "退款失败，请稍后重试。";
          showRefundMoneyError(getRefundErrorTarget(message), message);
          return;
        }
        closeRefundModal();
        return;
      }
      if (!Number.isFinite(nextPaymentPrice) || nextPaymentPrice < 0) {
        showRefundMoneyError(refundPaymentPriceInput, "付款价格式无效。");
        return;
      }
      if (!Number.isFinite(nextTotalPrice) || nextTotalPrice < 0) {
        showRefundMoneyError(refundTotalPriceInput, "会计价格式无效。");
        return;
      }
      if (!Number.isFinite(nextSettlementPrice) || nextSettlementPrice < 0) {
        showRefundMoneyError(refundSettlementPriceInput, "会计结算价格式无效。");
        return;
      }
      if (!Number.isFinite(originalPaymentPrice) || originalPaymentPrice < 0) {
        showRefundMoneyError(refundPaymentPriceInput, "当前付款价无效。");
        return;
      }
      if (!Number.isFinite(originalTotalPrice) || originalTotalPrice < 0) {
        showRefundMoneyError(refundTotalPriceInput, "当前会计价无效。");
        return;
      }
      if (!Number.isFinite(originalSettlementPrice) || originalSettlementPrice < 0) {
        showRefundMoneyError(refundSettlementPriceInput, "当前会计结算价无效。");
        return;
      }
      const originalPaymentCents = Math.round(originalPaymentPrice * 100);
      const originalTotalCents = Math.round(originalTotalPrice * 100);
      const originalSettlementCents = Math.round(originalSettlementPrice * 100);
      const nextPaymentCents = Math.round(nextPaymentPrice * 100);
      const nextTotalCents = Math.round(nextTotalPrice * 100);
      const nextSettlementCents = Math.round(nextSettlementPrice * 100);
      if (nextPaymentCents > originalPaymentCents) {
        showRefundMoneyError(refundPaymentPriceInput, "付款价需要小于或等于当前付款价。");
        return;
      }
      if (nextTotalCents > originalTotalCents) {
        showRefundMoneyError(refundTotalPriceInput, "会计价需要小于或等于当前会计价。");
        return;
      }
      if (nextSettlementCents > originalSettlementCents) {
        showRefundMoneyError(refundSettlementPriceInput, "会计结算价需要小于或等于当前会计结算价。");
        return;
      }
      if (
        nextPaymentCents >= originalPaymentCents
        && nextTotalCents >= originalTotalCents
        && nextSettlementCents >= originalSettlementCents
      ) {
        showRefundMoneyError(refundPaymentPriceInput, "付款价、会计价、会计结算价至少一项需要小于原数据。");
        return;
      }

      try {
        setRefundFormHint("提交退款中...", "pending");
        const nextRefundStatus = nextPaymentCents === 0 && nextTotalCents === 0 && nextSettlementCents === 0
          ? "refunded"
          : "partial_refunded";
        await withLoading(
          {
            button: refundFormSubmitBtn,
            form: refundForm,
            buttonText: "提交中..."
          },
          () => updateRecordById(recordId, {
            refundStatus: nextRefundStatus,
            paymentPrice: nextPaymentPrice,
            totalPrice: nextTotalPrice,
            settlementPrice: nextSettlementPrice
          })
        );
      } catch (error) {
        console.error(error);
        const message = error.message || "退款失败，请稍后重试。";
        showRefundMoneyError(getRefundErrorTarget(message), message);
        return;
      }
      closeRefundModal();
    });

    [refundPaymentPriceInput, refundTotalPriceInput, refundSettlementPriceInput].forEach((input) => {
      input.addEventListener("input", () => {
        clearInlineFieldError(input);
        syncRefundPremiumPriceFromPrices();
      });
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
        await withLoading(
          {
            button: deleteBtn,
            buttonText: "删除中"
          },
          () => deleteAccountant(accountantUsername)
        );
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

    tableBody.addEventListener("mouseover", (event) => {
      const cell = getTableTooltipCell(event.target);
      if (!cell || !shouldShowTableTooltipCell(cell)) {
        hideTableHoverTooltip();
        return;
      }
      if (event.relatedTarget instanceof Node && cell.contains(event.relatedTarget)) return;
      showTableHoverTooltip(cell.dataset.tableTooltip, event);
    });

    tableBody.addEventListener("mousemove", (event) => {
      const cell = getTableTooltipCell(event.target);
      if (!cell || !shouldShowTableTooltipCell(cell)) {
        hideTableHoverTooltip();
        return;
      }
      if (tableHoverTooltip.hidden) {
        showTableHoverTooltip(cell.dataset.tableTooltip, event);
        return;
      }
      moveTableHoverTooltip(event);
    });

    tableBody.addEventListener("mouseout", (event) => {
      const cell = getTableTooltipCell(event.target);
      if (!cell) return;
      if (event.relatedTarget instanceof Node && cell.contains(event.relatedTarget)) return;
      hideTableHoverTooltip();
    });

    tableBody.addEventListener("mouseleave", () => {
      hideTableHoverTooltip();
    });

    if (bossSettlementDetailList) {
      bossSettlementDetailList.addEventListener("click", async (event) => {
        const sortBtn = event.target.closest(".settlement-detail-sort-btn");
        if (sortBtn) {
          updateBossSettlementDetailSort(sortBtn.dataset.detailSortKey);
          return;
        }

        const payoutSelectedBtn = event.target.closest("[data-settlement-payout-selected]");
        if (payoutSelectedBtn) {
          if (!requireAccount()) return;
          if (payoutSelectedBtn.disabled) return;
          await submitBossSettlementPayout(getSelectedBossSettlementPayoutRecordIds());
          return;
        }

        const payoutSelectAllBtn = event.target.closest("[data-settlement-payout-select-all]");
        if (payoutSelectAllBtn) {
          if (!requireAccount()) return;
          if (payoutSelectAllBtn.disabled) return;
          const payoutRecordIds = String(payoutSelectAllBtn.dataset.recordIds || "")
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
          const shouldSelectAll = payoutRecordIds.some((recordId) => !isBossSettlementPayoutRecordSelected(recordId));
          setBossSettlementPayoutRecordSelected(payoutRecordIds, shouldSelectAll);
          renderBossSettlementDetailModalContent();
          return;
        }

        const payoutBtn = event.target.closest(".settlement-detail-payout-btn");
        if (payoutBtn) {
          if (!requireAccount()) return;
          if (payoutBtn.disabled) return;
          const payoutRecordIds = String(payoutBtn.dataset.recordIds || "")
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
          await submitBossSettlementPayout(payoutRecordIds);
          return;
        }

        const invoiceThumb = event.target.closest(".settlement-detail-invoice-thumb");
        if (!invoiceThumb) return;
        if (!requireAccount()) return;
        const recordId = String(invoiceThumb.dataset.recordId || "").trim();
        if (!recordId) return;
        const targetRecord = records.find((item) => String(item.id || "").trim() === recordId) || null;
        if (!targetRecord) return;
        openInvoicePreviewModal(targetRecord);
      });

      bossSettlementDetailList.addEventListener("change", (event) => {
        const checkbox = event.target.closest(".settlement-detail-payout-checkbox");
        if (!checkbox) return;
        const payoutRecordIds = String(checkbox.dataset.recordIds || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
        setBossSettlementPayoutRecordSelected(payoutRecordIds, checkbox.checked);
        renderBossSettlementDetailModalContent();
      });
    }

    tableBody.addEventListener("click", async (event) => {
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
        if (hasRecordAccountantConfirmation(targetRecord)) return;
        openEditModal(targetRecord);
        return;
      }

      const refundBtn = event.target.closest(".row-refund-btn");
      if (refundBtn) {
        if (!requireAccount()) return;
        const recordId = String(refundBtn.dataset.recordId || "").trim();
        if (!recordId) return;
        const targetRecord = records.find((item) => String(item.id || "").trim() === recordId) || null;
        if (!targetRecord) return;
        openRefundModal(targetRecord);
        return;
      }

      const historyBtn = event.target.closest(".row-history-btn");
      if (historyBtn) {
        if (!requireAccount()) return;
        const recordId = String(historyBtn.dataset.recordId || "").trim();
        if (!recordId) return;
        const targetRecord = records.find((item) => String(item.id || "").trim() === recordId) || null;
        if (!targetRecord) return;
        openRecordHistoryModal(targetRecord);
        dismissUpdatedRowHighlight(recordId);
        renderTable();
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
        await withLoading(
          {
            button: deleteBtn,
            buttonText: "删除中"
          },
          () => deleteRecordById(recordId)
        );
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

    refundModal.addEventListener("click", (event) => {
      if (event.target === refundModal) {
        closeRefundModal();
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

    if (openPriceCompositionBtn) {
      openPriceCompositionBtn.addEventListener("click", () => {
        openPriceCompositionModal();
      });
    }

    if (openOperationRecordsBtn) {
      openOperationRecordsBtn.addEventListener("click", () => {
        openOperationRecordsModal();
      });
    }

    if (operationRecordsModal) {
      operationRecordsModal.addEventListener("click", (event) => {
        if (event.target === operationRecordsModal) {
          closeOperationRecordsModal();
        }
      });
    }

    if (priceCompositionModal) {
      priceCompositionModal.addEventListener("click", (event) => {
        if (event.target === priceCompositionModal) {
          closePriceCompositionModal();
        }
      });
    }

    dispatcherModal.addEventListener("click", (event) => {
      if (event.target === dispatcherModal) {
        closeDispatcherModal();
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

      try {
        await withLoading(
          {
            button: trigger,
            buttonText: "还原中"
          },
          () => restoreRecycleBinRecordById(recycleId)
        );
      } catch (error) {
        console.error(error);
        setRecycleModalHint(error.message || "还原失败，请稍后重试。", "error");
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

    window.addEventListener("resize", () => {
      scheduleStickyTableColumnWidthSync();
      resizeAnalysisTrendChart();
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
        || !filterOrderPopover.hidden
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
        if (operationRecordsModal && !operationRecordsModal.hidden) {
          closeOperationRecordsModal();
          return;
        }
        if (priceCompositionModal && !priceCompositionModal.hidden) {
          closePriceCompositionModal();
          return;
        }
        closeAnalysisModal();
        return;
      }
      if (event.key === "Escape" && !dispatcherModal.hidden) {
        closeDispatcherModal();
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
      if (event.key === "Escape" && !refundModal.hidden) {
        closeRefundModal();
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
      const isCreateMode = !editingRecordId;
      const allowEmptyCreateFields = isCreateMode && isDevelopmentEnvironment();
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
        remark: String(formData.get("remark") || "").trim(),
        paymentPrice: paymentPriceRaw === "" ? (allowEmptyCreateFields ? "" : Number.NaN) : Number(paymentPriceRaw),
        totalPrice: totalPriceRaw === "" ? (allowEmptyCreateFields ? "" : Number.NaN) : Number(totalPriceRaw),
        settlementPrice: settlementPriceRaw === "" ? (allowEmptyCreateFields ? "" : Number.NaN) : Number(settlementPriceRaw)
      };

      if (isCreateMode && !allowEmptyCreateFields) {
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
          label: "会计结算价",
          raw: settlementPriceRaw,
          value: item.settlementPrice,
          input: settlementPriceInput
        }
      ];
      const invalidPriceField = priceFields.find((field) => (
        allowEmptyCreateFields
          ? (field.raw !== "" && (!Number.isFinite(field.value) || field.value < 0))
          : (field.raw === "" || !Number.isFinite(field.value) || field.value < 0)
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

      if (!item.accountant && !allowEmptyCreateFields) {
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
        setRecordFormHint(editingRecordId ? "修改保存中..." : "数据保存中...", "pending");
        await withLoading(
          {
            button: recordSubmitBtn,
            form: recordForm,
            buttonText: editingRecordId ? "保存中..." : "提交中..."
          },
          async () => {
            if (editingRecordId) {
              await updateRecordById(editingRecordId, item);
            } else {
              await createRecord({
                ...item,
                checkStatus: "pending"
              });
            }
          }
        );
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

    function finishBoot({ keepLoginHint = false } = {}) {
      if (!keepLoginHint) {
        setLoginRequestHint("", "idle");
      }
      renderBuildInfo();
      void fetchBuildInfo();
      syncDevTodoEntryPoint();
      loadDevTodoItems();
      renderDevTodoList();
    }

    async function init() {
      let shouldSyncData = false;
      let shouldFocusLogin = false;
      let bootFailed = false;

      try {
        bindInlineValidation(loginForm || loginPage, setLoginRequestHint);
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
        closeDispatcherModal();
        closeAccountantModal();
        closeAccountantRegisterModal();
        closeChangePasswordModal();
        closeRecycleModal();
        closeDevTodoModal();
        loadSavedLoginEntries();
        loadFromStorage();
        loadViewState();

        validateCurrentAccount();
        applyAccountToForm();
        renderSourcePickerOptions();
        renderPlatformShopPickerOptions();

        shouldSyncData = hasAuthenticatedAccount();
        shouldFocusLogin = !shouldSyncData;
        loginCodeInput.value = "";
        loginPasswordInput.value = "";
        setPageMode(shouldSyncData);
      } catch (error) {
        bootFailed = true;
        shouldSyncData = false;
        shouldFocusLogin = true;
        console.error(error);
        setPageMode(false);
        setLoginRequestHint("页面初始化失败，请刷新重试。", "error");
      } finally {
        try {
          finishBoot({ keepLoginHint: bootFailed });
        } catch (error) {
          console.error(error);
        }
        document.body.classList.remove("app-booting");
      }

      if (shouldSyncData) {
        await syncDataAfterLogin();
      } else if (shouldFocusLogin) {
        loginCodeInput.focus();
      }
    }

    init();
