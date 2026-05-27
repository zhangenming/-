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

    if (settlementScheduleToggleBtn) {
      settlementScheduleToggleBtn.addEventListener("click", () => {
        toggleSettlementScheduleCollapsed();
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
        const isInLoginPage = loginPage && !loginPage.hidden;
        openAccountantRegisterModal({ returnTarget: isInLoginPage ? "login-page" : "accountant-modal" });
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

    if (openDataModalBtn) {
      openDataModalBtn.addEventListener("click", () => {
        openPriceCompositionModal();
      });
    }

    if (openCustomerFeedbackModalBtn) {
      openCustomerFeedbackModalBtn.addEventListener("click", () => {
        openCustomerFeedbackModal();
      });
    }

    if (openDispatcherModalBtn) {
      openDispatcherModalBtn.addEventListener("click", async () => {
        await openDispatcherModal();
      });
    }

    openAccountantModalBtn.addEventListener("click", async () => {
      await openAccountantModal();
    });

    if (forceRefreshAccountantPagesBtn) {
      forceRefreshAccountantPagesBtn.addEventListener("click", async () => {
        if (!requireAccount()) return;
        if (!isBossLogin()) return;
        try {
          const result = await withLoading(
            {
              button: forceRefreshAccountantPagesBtn,
              buttonText: "刷新中..."
            },
            () => triggerForceRefreshForAccountantPages()
          );
          const deliveredCount = Number(result?.deliveredCount) || 0;
          showAppStatus(`已发送强制刷新指令，当前在线会计页面 ${deliveredCount} 个。`, "ok");
        } catch (error) {
          console.error(error);
          showAppStatus(error.message || "强制刷新失败，请稍后重试。", "error");
        }
      });
    }

    openRecycleModalBtn.addEventListener("click", async () => {
      await openRecycleModal();
    });

    if (openReminderModalBtn) {
      openReminderModalBtn.addEventListener("click", async () => {
        await openReminderModal();
      });
    }

    if (reminderForm) {
      reminderForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (isReminderSubmitting) return;
        const payload = {
          date: String(reminderDateInput.value || "").trim(),
          orderNo: String(reminderOrderInput.value || "").trim(),
          customerWechat: String(reminderWechatInput.value || "").trim()
        };
        if (!payload.date || !payload.orderNo || !payload.customerWechat) {
          showAppStatus("请填写日期、订单号、客户微信。", "error");
          return;
        }
        isReminderSubmitting = true;
        if (reminderSubmitBtn) reminderSubmitBtn.disabled = true;
        try {
          await createReminder(payload);
          reminderForm.reset();
          reminderDateInput.value = getTodayDateKey();
          reminderOrderInput.focus();
        } catch (error) {
          console.error(error);
          showAppStatus(error.message || "新建提醒失败，请稍后重试。", "error");
        } finally {
          isReminderSubmitting = false;
          if (reminderSubmitBtn) reminderSubmitBtn.disabled = false;
        }
      });
    }

    if (reminderList) {
      reminderList.addEventListener("click", async (event) => {
        const deleteBtn = event.target.closest(".reminder-delete-btn");
        if (!deleteBtn) return;
        const reminderId = String(deleteBtn.dataset.reminderId || "").trim();
        if (!reminderId) return;
        const confirmed = await openConfirmDialog({
          title: "删除提醒",
          message: "确认删除该条提醒？",
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
            () => deleteReminderById(reminderId)
          );
        } catch (error) {
          console.error(error);
          showAppStatus(error.message || "删除提醒失败，请稍后重试。", "error");
        }
      });
    }

    window.setInterval(() => {
      updateReminderEntryButton();
      if (reminderModal && !reminderModal.hidden) {
        renderReminderModalContent();
      }
    }, 60000);

    if (bossSettlementBtn) {
      bossSettlementBtn.addEventListener("click", () => {
        openBossSettlementSummaryModal();
      });
    }

    if (bossSettlementSummaryBtn) {
      bossSettlementSummaryBtn.addEventListener("click", () => {
        if (!requireAccount()) return;
        if (!isBossLogin()) return;
        openBossSettlementDetailModal();
      });
    }

    if (bossSettlementDetailBtn) {
      bossSettlementDetailBtn.addEventListener("click", () => {
        openBossSettlementDetailModal();
      });
    }

    if (accountantUploadedSettlementDetailBtn) {
      accountantUploadedSettlementDetailBtn.addEventListener("click", () => {
        if (!requireAccount()) return;
        if (!isAccountantLogin()) return;
        setBossSettlementDetailPayoutStatusFilter("payable");
        openBossSettlementDetailModal();
      });
    }

    function openSettlementDetailInvoiceThumb(thumb) {
      if (!thumb) return;
      if (!requireAccount()) return;
      const recordId = String(thumb.dataset.recordId || "").trim();
      const previewImage = {
        id: String(thumb.dataset.invoiceImageId || "").trim(),
        name: String(thumb.dataset.invoiceImageName || "").trim(),
        fileName: String(thumb.dataset.invoiceImageFileName || "").trim(),
        url: String(thumb.dataset.invoiceImageUrl || "").trim()
      };
      if (!recordId && !previewImage.url && !previewImage.fileName) return;
      const targetRecord = records.find((item) => String(item?.id || "").trim() === recordId) || null;
      if (!targetRecord && !previewImage.url && !previewImage.fileName) return;
      openInvoicePreviewModal(targetRecord, {
        ownerName: String(thumb.dataset.invoiceOwner || "").trim(),
        uploadedBy: String(thumb.dataset.invoiceUploadedBy || "").trim(),
        uploadedAt: String(thumb.dataset.invoiceUploadedAt || "").trim(),
        image: previewImage
      });
    }

    function bindSettlementDetailInvoiceThumbEvents(container) {
      if (!container) return;
      container.addEventListener("dblclick", (event) => {
        const invoiceThumb = event.target.closest(".settlement-detail-invoice-thumb");
        if (!invoiceThumb || !container.contains(invoiceThumb)) return;
        event.preventDefault();
        event.stopPropagation();
        openSettlementDetailInvoiceThumb(invoiceThumb);
      });
      container.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        const invoiceThumb = event.target.closest(".settlement-detail-invoice-thumb");
        if (!invoiceThumb || !container.contains(invoiceThumb)) return;
        event.preventDefault();
        event.stopPropagation();
        openSettlementDetailInvoiceThumb(invoiceThumb);
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
      devTodoList.addEventListener("click", async (event) => {
        const deleteBtn = event.target.closest(".dev-todo-item-delete");
        if (!deleteBtn) return;
        const todoId = String(deleteBtn.dataset.todoId || "").trim();
        if (!todoId) return;
        const confirmed = await openConfirmDialog({
          title: "删除待办",
          message: "确认删除该条待办？",
          confirmText: "确认删除",
          tone: "danger"
        });
        if (!confirmed) return;
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

    if (accountantSearchInput) {
      accountantSearchInput.addEventListener("input", () => {
        renderAccountantList();
      });
    }

    if (accountantSearchClearBtn && accountantSearchInput) {
      accountantSearchClearBtn.addEventListener("click", () => {
        accountantSearchInput.value = "";
        renderAccountantList();
        accountantSearchInput.focus();
      });
    }

    dispatcherSortableHeaders.forEach((button) => {
      button.addEventListener("click", () => {
        toggleDispatcherSort(button.dataset.key || "");
      });
    });

    function clearSingleFilter(key) {
      if (key === "month") {
        clearDateFilterState();
      }
      if (key === "completedAt") {
        clearCompletedAtFilterState();
      }
      if (key === "dispatcher") setDispatcherFilterValues([]);
      if (key === "orderNo") {
        filterState.orderNo = "";
        if (filterOrderInput) filterOrderInput.value = "";
      }
      if (key === "accountant") setAccountantFilterValues([]);
      if (key === "settlementRatio") filterState.settlementRatio = "";
      if (key === "customer") {
        filterState.customer = "";
        if (filterCustomerInput) filterCustomerInput.value = "";
      }
      if (key === "summary") {
        filterState.summary = "";
        if (filterSummaryInput) filterSummaryInput.value = "";
      }
      if (key === "remark") {
        filterState.remark = "";
        if (filterRemarkInput) filterRemarkInput.value = "";
      }
      if (key === "platform") filterState.platform = "";
      if (key === "shopName") filterState.shopName = "";
      if (key === "source") filterState.source = "";
      if (key === "status") setStatusFilterValues([]);
      if (key === "settled") filterState.settled = "";
      closeAllFilterPopovers();
      renderTable();
    }

    function hasSingleFilterValue(key) {
      if (key === "month") return hasDateFilterSelected();
      if (key === "completedAt") return hasDateFilterSelected({
        month: filterState.completedAtMonth,
        dateStart: filterState.completedAtStart,
        dateEnd: filterState.completedAtEnd
      });
      if (key === "dispatcher") return hasDispatcherFilterSelected();
      if (key === "orderNo") return Boolean(filterState.orderNo);
      if (key === "accountant") return hasAccountantFilterSelected();
      if (key === "settlementRatio") return Boolean(filterState.settlementRatio);
      if (key === "customer") return Boolean(filterState.customer);
      if (key === "summary") return Boolean(filterState.summary);
      if (key === "remark") return Boolean(filterState.remark);
      if (key === "platform") return Boolean(filterState.platform);
      if (key === "shopName") return Boolean(filterState.shopName);
      if (key === "source") return Boolean(filterState.source);
      if (key === "status") return hasStatusFilterSelected();
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
    filterCompletedAtBtn.addEventListener("click", (event) => handleFilterButtonClick(event, "completedAt"));
    filterDispatcherBtn.addEventListener("click", (event) => handleFilterButtonClick(event, "dispatcher"));
    filterOrderBtn.addEventListener("click", (event) => handleFilterButtonClick(event, "orderNo"));
    filterAccountantBtn.addEventListener("click", (event) => handleFilterButtonClick(event, "accountant"));
    filterSettlementRatioBtn.addEventListener("click", (event) => handleFilterButtonClick(event, "settlementRatio"));
    filterCustomerBtn.addEventListener("click", (event) => handleFilterButtonClick(event, "customer"));
    filterSummaryBtn.addEventListener("click", (event) => handleFilterButtonClick(event, "summary"));
    filterRemarkBtn.addEventListener("click", (event) => handleFilterButtonClick(event, "remark"));
    filterPlatformBtn.addEventListener("click", (event) => handleFilterButtonClick(event, "platform"));
    filterShopBtn.addEventListener("click", (event) => handleFilterButtonClick(event, "shopName"));
    filterSourceBtn.addEventListener("click", (event) => handleFilterButtonClick(event, "source"));
    filterStatusBtn.addEventListener("click", (event) => handleFilterButtonClick(event, "status"));
    filterSettledBtn.addEventListener("click", (event) => handleFilterButtonClick(event, "settled"));

    filterMonthValue.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleFilterPopover("month");
    });
    filterCompletedAtValue.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleFilterPopover("completedAt");
    });
    filterDispatcherValue.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleFilterPopover("dispatcher");
    });
    filterOrderValue.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleFilterPopover("orderNo");
    });
    filterAccountantValue.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleFilterPopover("accountant");
    });
    filterSettlementRatioValue.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleFilterPopover("settlementRatio");
    });
    filterCustomerValue.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleFilterPopover("customer");
    });
    filterSummaryValue.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleFilterPopover("summary");
    });
    filterRemarkValue.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleFilterPopover("remark");
    });
    filterPlatformValue.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleFilterPopover("platform");
    });
    filterShopValue.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleFilterPopover("shopName");
    });
    filterSourceValue.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleFilterPopover("source");
    });
    filterStatusValue.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleFilterPopover("status");
    });
    filterSettledValue.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleFilterPopover("settled");
    });

    filterMonthPopover.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    filterCompletedAtPopover.addEventListener("click", (event) => {
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

    filterSettlementRatioPopover.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    filterCustomerPopover.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    filterSummaryPopover.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    filterRemarkPopover.addEventListener("click", (event) => {
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

    filterCompletedAtList.addEventListener("click", (event) => {
      const target = event.target.closest(".filter-option-btn");
      if (!target) return;
      const selected = target.dataset.filterValue || "";
      const nextMonth = filterState.completedAtMonth === selected ? "" : selected;
      clearCompletedAtFilterState();
      filterState.completedAtMonth = nextMonth;
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

    if (filterCompletedAtRangeApplyBtn) {
      filterCompletedAtRangeApplyBtn.addEventListener("click", () => {
        applyCompletedAtRangeFilter();
        closeAllFilterPopovers();
        renderTable();
      });
    }

    if (filterCompletedAtRangeClearBtn) {
      filterCompletedAtRangeClearBtn.addEventListener("click", () => {
        clearCompletedAtFilterState();
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

    const handleCompletedAtRangeInputKeydown = (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      applyCompletedAtRangeFilter();
      closeAllFilterPopovers();
      renderTable();
    };

    if (filterCompletedAtStartInput) {
      filterCompletedAtStartInput.addEventListener("keydown", handleCompletedAtRangeInputKeydown);
    }

    if (filterCompletedAtEndInput) {
      filterCompletedAtEndInput.addEventListener("keydown", handleCompletedAtRangeInputKeydown);
    }

    filterDispatcherList.addEventListener("click", (event) => {
      const target = event.target.closest(".filter-option-btn");
      if (!target) return;
      const selected = target.dataset.filterValue || "";
      toggleDispatcherFilterValue(selected);
      updateFilterOptions();
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
        const selectionStart = filterOrderInput.selectionStart;
        const selectionEnd = filterOrderInput.selectionEnd;
        const sanitized = sanitizeOrderNoInput(filterOrderInput.value, true);
        if (sanitized !== filterOrderInput.value) {
          const diff = filterOrderInput.value.length - sanitized.length;
          filterOrderInput.value = sanitized;
          filterOrderInput.setSelectionRange(
            Math.max(0, selectionStart - diff),
            Math.max(0, selectionEnd - diff)
          );
        }
        applyOrderNoFilter({ closePopover: false });
      });
      filterOrderInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
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
      toggleAccountantFilterValue(selected);
      updateFilterOptions();
      renderTable();
    });

    filterSettlementRatioList.addEventListener("click", (event) => {
      const target = event.target.closest(".filter-option-btn");
      if (!target) return;
      const selected = target.dataset.filterValue || "";
      filterState.settlementRatio = filterState.settlementRatio === selected ? "" : selected;
      closeAllFilterPopovers();
      renderTable();
    });

    function applyTextColumnFilter(key, input, options = {}) {
      filterState[key] = String(input?.value || "").trim();
      if (options.closePopover) {
        closeAllFilterPopovers();
      }
      renderTable();
    }

    [
      { key: "customer", input: filterCustomerInput },
      { key: "summary", input: filterSummaryInput },
      { key: "remark", input: filterRemarkInput },
    ].forEach(({ key, input }) => {
      if (!input) return;
      input.addEventListener("input", () => {
        applyTextColumnFilter(key, input, { closePopover: false });
      });
      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          closeAllFilterPopovers();
        }
        if (event.key === "Escape") {
          closeAllFilterPopovers();
        }
      });
    });

    if (filterAccountantSearchInput) {
      filterAccountantSearchInput.addEventListener("input", () => {
        updateFilterOptions();
      });
      filterAccountantSearchInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          const firstOption = filterAccountantList.querySelector(".filter-option-btn");
          if (firstOption) {
            toggleAccountantFilterValue(firstOption.dataset.filterValue || "");
            updateFilterOptions();
            renderTable();
          }
        }
        if (event.key === "Escape") {
          closeAllFilterPopovers();
        }
      });
    }

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
      toggleStatusFilterValue(selected);
      updateFilterOptions();
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
      clearCompletedAtFilterState();
      setDispatcherFilterValues([]);
      filterState.orderNo = "";
      setAccountantFilterValues([]);
      filterState.settlementRatio = "";
      filterState.customer = "";
      filterState.summary = "";
      filterState.remark = "";
      filterState.platform = "";
      filterState.shopName = "";
      filterState.source = "";
      setStatusFilterValues([]);
      filterState.settled = "";
      if (filterOrderInput) filterOrderInput.value = "";
      if (filterCustomerInput) filterCustomerInput.value = "";
      if (filterSummaryInput) filterSummaryInput.value = "";
      if (filterRemarkInput) filterRemarkInput.value = "";
      closeAllFilterPopovers();
      renderTable();
    });

    if (orderNoInput) {
      orderNoInput.addEventListener("input", () => {
        const selectionStart = orderNoInput.selectionStart;
        const selectionEnd = orderNoInput.selectionEnd;
        const sanitized = sanitizeOrderNoInput(orderNoInput.value, false);
        if (sanitized !== orderNoInput.value) {
          const diff = orderNoInput.value.length - sanitized.length;
          orderNoInput.value = sanitized;
          orderNoInput.setSelectionRange(
            Math.max(0, selectionStart - diff),
            Math.max(0, selectionEnd - diff)
          );
        }
      });
    }

    if (reminderOrderInput) {
      reminderOrderInput.addEventListener("input", () => {
        const selectionStart = reminderOrderInput.selectionStart;
        const selectionEnd = reminderOrderInput.selectionEnd;
        const sanitized = sanitizeOrderNoInput(reminderOrderInput.value, false);
        if (sanitized !== reminderOrderInput.value) {
          const diff = reminderOrderInput.value.length - sanitized.length;
          reminderOrderInput.value = sanitized;
          reminderOrderInput.setSelectionRange(
            Math.max(0, selectionStart - diff),
            Math.max(0, selectionEnd - diff)
          );
        }
      });
    }

    if (accountantRegisterForm) {
      accountantRegisterForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const password = String(accountantRegisterPasswordInput?.value || "").trim();
        const alias = String(accountantRegisterAliasInput?.value || "").trim();
        const phone = String(accountantRegisterPhoneInput?.value || "").trim();
        const realName = String(accountantRegisterRealNameInput?.value || "").trim();
        const idCardNo = String(accountantRegisterIdCardInput?.value || "").trim();
        const bankName = String(accountantRegisterBankNameInput?.value || "").trim();
        const bankCardNo = String(accountantRegisterBankCardInput?.value || "").trim();
        const declarationPhone = String(accountantRegisterDeclarationPhoneInput?.value || "").trim();
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
            message: "请输入微信名。"
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

        const hasAnyRecipientInfo = realName || idCardNo || bankName || bankCardNo || declarationPhone;
        const invoiceRecipientInfo = hasAnyRecipientInfo ? {
          name: realName,
          idCardNo,
          bankName,
          bankCardNo,
          declarationPhone
        } : null;

        try {
          setAccountantRegisterHint("注册会计中...", "pending");
          await withLoading(
            {
              button: accountantRegisterSubmitBtn,
              form: accountantRegisterForm,
              buttonText: "注册中..."
            },
            () => registerAccountantProfile({
              password,
              alias,
              phone,
              realName,
              invoiceRecipientInfo
            })
          );
        } catch (error) {
          console.error(error);
          const message = error.message || "注册会计失败";
          showInlineFormError({
            form: accountantRegisterForm,
            hintSetter: setAccountantRegisterHint,
            target: getAccountantRegisterErrorTarget(message),
            message
          });
          return;
        }

        resetAccountantRegisterForm();
        if (accountantRegisterReturnTarget === "login-page") {
          closeAccountantRegisterModal();
          setLoginRequestHint("注册成功，请使用手机号和密码登录。", "ok");
          if (loginCodeInput) {
            loginCodeInput.value = phone;
          }
          if (loginPasswordInput) {
            loginPasswordInput.focus();
          }
        } else {
          await restoreAccountantModalAfterRegister({
            hintText: "注册会计成功",
            hintState: "ok"
          });
        }
      });
    }

    if (accountantEditForm) {
      accountantEditForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const originalUsername = String(accountantEditOriginalUsernameInput?.value || editingAccountantUsername || "").trim();
        const password = String(accountantEditPasswordInput?.value || "").trim();
        const alias = String(accountantEditAliasInput?.value || "").trim();
        const phone = String(accountantEditPhoneInput?.value || "").trim();
        const recipientInfo = {
          name: String(accountantEditRecipientNameInput?.value || "").trim(),
          idCardNo: String(accountantEditRecipientIdCardInput?.value || "").trim(),
          bankName: String(accountantEditRecipientBankInput?.value || "").trim(),
          bankCardNo: String(accountantEditRecipientBankCardInput?.value || "").trim(),
          declarationPhone: String(accountantEditRecipientPhoneInput?.value || "").trim()
        };
        const canEditSensitiveFields = canEditAccountantSensitiveFields(accountantEditMode);
        const canEditRecipientFields = accountantEditMode === "admin";

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
        if (canEditRecipientFields) {
          const recipientTargets = [
            [accountantEditRecipientNameInput, recipientInfo.name, "请输入结算申报姓名。"],
            [accountantEditRecipientIdCardInput, recipientInfo.idCardNo, "请输入身份证号。"],
            [accountantEditRecipientBankInput, recipientInfo.bankName, "请输入开户行。"],
            [accountantEditRecipientBankCardInput, recipientInfo.bankCardNo, "请输入银行卡号。"],
            [accountantEditRecipientPhoneInput, recipientInfo.declarationPhone, "请输入申报手机号。"]
          ];
          const invalidRecipientField = recipientTargets.find(([, value]) => !value);
          if (invalidRecipientField) {
            const [target, , message] = invalidRecipientField;
            showInlineFormError({
              form: accountantEditForm,
              hintSetter: setAccountantEditHint,
              target,
              message
            });
            return;
          }
        }

        try {
          const payload = {
            alias
          };
          if (canEditSensitiveFields) {
            payload.password = password;
            payload.phone = phone;
          }
          if (canEditRecipientFields) {
            payload.invoiceRecipientInfo = recipientInfo;
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
      if (!customerFeedback) {
        showInlineFormError({
          form: completeForm,
          hintSetter: setCompleteFormHint,
          target: completeCustomerFeedbackInput,
          message: "客户反馈为必填项。"
        });
        return;
      }
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
        if (!canCurrentAccountExportTableRecords()) return;
        exportCurrentTableRecords();
      });
    }

    if (invoiceRecipientInfoBtn && invoiceRecipientInfoForm) {
      invoiceRecipientInfoBtn.addEventListener("click", () => {
        if (!requireAccount()) return;
        if (!canCurrentAccountManageInvoiceRecipientInfo()) return;
        openInvoiceRecipientInfoModal();
      });

      if (invoiceRecipientInfoCancelBtn) {
        invoiceRecipientInfoCancelBtn.addEventListener("click", () => {
          closeInvoiceRecipientInfoModal();
        });
      }

      invoiceRecipientInfoForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (!requireAccount()) return;
        if (!canCurrentAccountManageInvoiceRecipientInfo()) return;
        if (getLockedInvoiceRecipientInfoForCurrentAccount()) {
          closeInvoiceRecipientInfoModal();
          return;
        }
        const profile = getInvoiceRecipientProfileForCurrentAccount();
        const originalUsername = String(profile?.username || "").trim();
        const info = {
          name: String(invoiceRecipientNameInput?.value || "").trim(),
          bankName: String(invoiceRecipientBankInput?.value || "").trim(),
          bankCardNo: String(invoiceRecipientBankCardInput?.value || "").trim(),
          idCardNo: String(invoiceRecipientIdCardInput?.value || "").trim(),
          declarationPhone: String(invoiceRecipientPhoneInput?.value || "").trim()
        };
        const showInvoiceRecipientError = (target, message) => {
          showInlineFormError({
            form: invoiceRecipientInfoForm,
            hintSetter: setInvoiceRecipientInfoHint,
            target,
            message
          });
        };
        if (!originalUsername) {
          showInvoiceRecipientError(invoiceRecipientNameInput, "当前账号缺少可保存的会计资料。");
          return;
        }
        if (!info.name) {
          showInvoiceRecipientError(invoiceRecipientNameInput, "请输入姓名。");
          return;
        }
        if (!info.idCardNo) {
          showInvoiceRecipientError(invoiceRecipientIdCardInput, "请输入身份证号。");
          return;
        }
        if (!info.bankName) {
          showInvoiceRecipientError(invoiceRecipientBankInput, "请输入开户行。");
          return;
        }
        if (!info.bankCardNo) {
          showInvoiceRecipientError(invoiceRecipientBankCardInput, "请输入银行卡号。");
          return;
        }
        if (!info.declarationPhone) {
          showInvoiceRecipientError(invoiceRecipientPhoneInput, "请输入申报手机号。");
          return;
        }

        try {
          setInvoiceRecipientInfoHint("结算申报信息保存中...", "pending");
          await withLoading(
            {
              button: invoiceRecipientInfoSubmitBtn,
              form: invoiceRecipientInfoForm,
              buttonText: "保存中..."
            },
            () => updateAccountantProfile(originalUsername, { invoiceRecipientInfo: info })
          );
        } catch (error) {
          console.error(error);
          showInvoiceRecipientError(invoiceRecipientNameInput, error.message || "保存失败，请稍后重试。");
          return;
        }

        closeInvoiceRecipientInfoModal();
        showAppStatus("结算申报信息已保存。", "ok");
      });
    }

    if (accountantInvoiceUploadBtn && invoiceUploadForm && accountantInvoiceImageInput) {
      accountantInvoiceUploadBtn.addEventListener("click", async () => {
        if (!requireAccount()) return;
        if (!canCurrentAccountUploadSettlementInvoice()) return;
        if (!(await requireInvoiceRecipientInfoBeforeUpload())) return;
        const targetRecords = getAccountantInvoiceUploadTargetRecords(records);
        if (!targetRecords.length) {
          updateAccountantInvoiceUploadControls();
          return;
        }
        await openInvoiceUploadModal();
      });

      accountantInvoiceImageInput.addEventListener("change", () => {
        resetInvoiceUploadImageName();
        updateInvoiceUploadImagePreview();
        clearInlineFieldError(accountantInvoiceImageInput);
        setInvoiceUploadFormHint("", "idle");
      });

      if (invoiceUploadCancelBtn) {
        invoiceUploadCancelBtn.addEventListener("click", () => {
          closeInvoiceUploadModal();
        });
      }

      invoiceUploadForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (!requireAccount()) return;
        if (!canCurrentAccountUploadSettlementInvoice()) return;
        const file = accountantInvoiceImageInput.files && accountantInvoiceImageInput.files[0]
          ? accountantInvoiceImageInput.files[0]
          : null;
        const info = getLockedInvoiceRecipientInfoForCurrentAccount();
        const showInvoiceUploadError = (target, message) => {
          showInlineFormError({
            form: invoiceUploadForm,
            hintSetter: setInvoiceUploadFormHint,
            target,
            message
          });
        };
        if (!file) {
          showInvoiceUploadError(accountantInvoiceImageInput, "请选择发票图片。");
          return;
        }
        if (!String(file.type || "").toLowerCase().startsWith("image/")) {
          showInvoiceUploadError(accountantInvoiceImageInput, "只支持图片文件。");
          return;
        }
        if (Number(file.size || 0) > SETTLEMENT_INVOICE_IMAGE_MAX_SIZE_BYTES) {
          showInvoiceUploadError(accountantInvoiceImageInput, `发票图片“${file.name || "未命名图片"}”超过 5MB。`);
          return;
        }
        if (!info) {
          showInvoiceUploadError(accountantInvoiceImageInput, "请先录入结算申报信息。");
          return;
        }

        isInvoiceUploadSubmitting = true;
        updateAccountantInvoiceUploadControls();
        try {
          setInvoiceUploadFormHint("发票上传中...", "pending");
          const dataUrl = await readFileAsDataUrl(file);
          const result = await withLoading({
            button: invoiceUploadSubmitBtn,
            form: invoiceUploadForm,
            buttonText: "上传中..."
          }, () => uploadSettlementInvoice({
            image: {
              name: String(file.name || "").trim(),
              dataUrl
            },
            invoiceRecipientInfo: info,
            replaceRecordIds: invoiceUploadReplaceRecordIds
          }));
          const count = result.uploadedRecordIds.length;
          const isReplaceMode = invoiceUploadReplaceRecordIds.length > 0;
          if (!isReplaceMode) {
            hasUploadedSettlementInvoiceThisSession = true;
          }
          closeInvoiceUploadModal();
          showAppStatus(
            count
              ? (isReplaceMode
                  ? `发票已修改，已更新 ${count} 条数据。`
                  : `发票已上传，已更新 ${count} 条状态为${getRecordWorkflowStatusLabelByKey("uploaded")}的数据。`)
              : (isReplaceMode ? "发票已修改。" : "发票已上传。"),
            "ok"
          );
        } catch (error) {
          console.error(error);
          showInvoiceUploadError(accountantInvoiceImageInput, error.message || "发票上传失败，请稍后重试。");
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
      showTableHoverTooltip(cell, event);
    });

    tableBody.addEventListener("mousemove", (event) => {
      const cell = getTableTooltipCell(event.target);
      if (!cell || !shouldShowTableTooltipCell(cell)) {
        hideTableHoverTooltip();
        return;
      }
      if (tableHoverTooltip.hidden) {
        showTableHoverTooltip(cell, event);
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

    tableBody.addEventListener("dblclick", (event) => {
      const statusCell = event.target.closest(".data-col-status[data-record-id]");
      if (!statusCell || !tableBody.contains(statusCell)) return;
      const recordId = String(statusCell.dataset.recordId || "").trim();
      if (!recordId) return;
      const targetRecord = records.find((item) => String(item?.id || "").trim() === recordId) || null;
      if (!targetRecord || !getSettlementInvoiceImage(targetRecord)) return;
      hideTableHoverTooltip();
      openInvoicePreviewModal(targetRecord);
    });

    tableBody.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const statusChip = event.target.closest(".record-status-chip.has-invoice-preview");
      if (!statusChip || !tableBody.contains(statusChip)) return;
      const statusCell = statusChip.closest(".data-col-status[data-record-id]");
      const recordId = String(statusCell?.dataset.recordId || "").trim();
      if (!recordId) return;
      const targetRecord = records.find((item) => String(item?.id || "").trim() === recordId) || null;
      if (!targetRecord || !getSettlementInvoiceImage(targetRecord)) return;
      event.preventDefault();
      hideTableHoverTooltip();
      openInvoicePreviewModal(targetRecord);
    });

    if (bossSettlementDetailList) {
      bossSettlementDetailList.addEventListener("click", async (event) => {
        const statusFilterBtn = event.target.closest("[data-detail-payout-status-filter]");
        if (statusFilterBtn) {
          setBossSettlementDetailPayoutStatusFilter(statusFilterBtn.dataset.detailPayoutStatusFilter || "");
          return;
        }

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

        const replaceBtn = event.target.closest("[data-invoice-replace-record-ids]");
        if (replaceBtn) {
          if (!requireAccount()) return;
          if (replaceBtn.disabled) return;
          const recordIds = String(replaceBtn.dataset.invoiceReplaceRecordIds || "")
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
          if (!recordIds.length) {
            showAppStatus("当前发票记录已刷新，请重新打开明细。", "error");
            return;
          }
          await openInvoiceUploadModal({ replaceRecordIds: recordIds });
          return;
        }

        const revokeBtn = event.target.closest(".settlement-detail-payout-revoke-btn");
        if (revokeBtn) {
          if (!requireAccount()) return;
          if (revokeBtn.disabled) return;
          hideTableHoverTooltip();
          const recordIds = String(revokeBtn.dataset.recordIds || "")
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
          await submitBossSettlementPayoutRevoke(recordIds);
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
        if (invoiceThumb) return;
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
      bindSettlementDetailInvoiceThumbEvents(bossSettlementDetailList);
    }

    if (settlementDetailTabAccountant && settlementDetailTabDispatcher) {
      settlementDetailTabAccountant.addEventListener("click", () => {
        if (settlementDetailActiveTab === "accountant") return;
        settlementDetailActiveTab = "accountant";
        settlementDetailTabAccountant.classList.add("active");
        settlementDetailTabDispatcher.classList.remove("active");
        renderBossSettlementDetailModalContent();
      });

      settlementDetailTabDispatcher.addEventListener("click", () => {
        if (settlementDetailActiveTab === "dispatcher") return;
        settlementDetailActiveTab = "dispatcher";
        settlementDetailTabDispatcher.classList.add("active");
        settlementDetailTabAccountant.classList.remove("active");
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
        if (!canCurrentAccountEditRecord(targetRecord)) return;
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

    if (invoiceUploadModal) {
      invoiceUploadModal.addEventListener("click", (event) => {
        if (event.target === invoiceUploadModal) {
          closeInvoiceUploadModal();
        }
      });
    }

    if (invoiceRecipientInfoModal) {
      invoiceRecipientInfoModal.addEventListener("click", (event) => {
        if (event.target === invoiceRecipientInfoModal) {
          closeInvoiceRecipientInfoModal();
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
        if (event.target.dataset.settlementPayoutExport !== undefined) {
          exportSettlementPayout();
        }
      });
    }

    analysisModal.addEventListener("click", (event) => {
      if (event.target === analysisModal) {
        closeAnalysisModal();
      }
    });

    if (customerFeedbackModal) {
      customerFeedbackModal.addEventListener("click", (event) => {
        if (event.target === customerFeedbackModal) {
          closeCustomerFeedbackModal();
        }
      });
    }

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

    const priceSegmentPremiumReception = document.getElementById("priceSegmentPremiumReception");
    if (priceSegmentPremiumReception) {
      priceSegmentPremiumReception.addEventListener("click", () => {
        openReceptionDetailModal();
      });
    }

    const priceSegmentTotalReception = document.getElementById("priceSegmentTotalReception");
    if (priceSegmentTotalReception) {
      priceSegmentTotalReception.addEventListener("click", () => {
        openReceptionDetailModal();
      });
    }

    const priceSegmentResultReception = document.getElementById("priceSegmentResultReception");
    if (priceSegmentResultReception) {
      priceSegmentResultReception.addEventListener("click", () => {
        openReceptionDetailModal();
      });
    }

    const priceSegmentAccounting = document.getElementById("priceSegmentAccounting");
    if (priceSegmentAccounting) {
      priceSegmentAccounting.addEventListener("click", () => {
        openAccountantDetailModal();
      });
    }

    if (receptionDetailModal) {
      receptionDetailModal.addEventListener("click", (event) => {
        if (event.target === receptionDetailModal) {
          closeReceptionDetailModal();
        }
      });
    }

    if (accountantDetailModal) {
      accountantDetailModal.addEventListener("click", (event) => {
        if (event.target === accountantDetailModal) {
          closeAccountantDetailModal();
        }
      });
    }

    if (reminderModal) {
      reminderModal.addEventListener("click", (event) => {
        if (event.target === reminderModal) {
          closeReminderModal();
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

    if (openChangeLogBtn) {
      openChangeLogBtn.addEventListener("click", () => {
        openChangeLogModal();
      });
    }

    if (closeChangeLogModalBtn) {
      closeChangeLogModalBtn.addEventListener("click", () => {
        closeChangeLogModal();
      });
    }

    if (changeLogModal) {
      changeLogModal.addEventListener("click", (event) => {
        if (event.target === changeLogModal) {
          closeChangeLogModal();
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
        if (!confirmDialogMathChallengePassed()) return;
        closeConfirmDialog(true);
      });
    }

    if (confirmModalMathInput) {
      confirmModalMathInput.addEventListener("input", () => {
        if (confirmModalMathHint) {
          confirmModalMathHint.textContent = "";
          confirmModalMathHint.hidden = true;
        }
      });
      confirmModalMathInput.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") return;
        event.preventDefault();
        if (!confirmDialogMathChallengePassed()) return;
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
      if (!document.body.classList.contains("modal-open")) {
        scheduleStickyTableColumnWidthSync();
      }
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
        || !filterCompletedAtPopover.hidden
        || !filterDispatcherPopover.hidden
        || !filterOrderPopover.hidden
        || !filterAccountantPopover.hidden
        || !filterSettlementRatioPopover.hidden
        || !filterCustomerPopover.hidden
        || !filterSummaryPopover.hidden
        || !filterRemarkPopover.hidden
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
      if (customerFeedbackModal && event.key === "Escape" && !customerFeedbackModal.hidden) {
        closeCustomerFeedbackModal();
        return;
      }
      if (reminderModal && event.key === "Escape" && !reminderModal.hidden) {
        closeReminderModal();
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
      if (changeLogModal && event.key === "Escape" && !changeLogModal.hidden) {
        closeChangeLogModal();
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
      if (invoiceUploadModal && event.key === "Escape" && !invoiceUploadModal.hidden) {
        closeInvoiceUploadModal();
        return;
      }
      if (invoiceRecipientInfoModal && event.key === "Escape" && !invoiceRecipientInfoModal.hidden) {
        closeInvoiceRecipientInfoModal();
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
          { key: "date", label: "接单日期", value: item.date },
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

      if (isCreateMode && !allowEmptyCreateFields && item.isMonthlySettlement) {
        const reminderDate = String(recordReminderDateInput?.value || "").trim();
        if (!reminderDate) {
          showInlineFormError({
            form: recordForm,
            hintSetter: setRecordFormHint,
            target: recordReminderDateInput,
            message: "月结必须输入提醒日期。"
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

      const zeroAccountantPriceFields = priceFields.filter((field) => (
        (field.label === "会计价" || field.label === "会计结算价") &&
        Number.isFinite(field.value) &&
        field.value === 0
      ));
      if (zeroAccountantPriceFields.length) {
        const confirmed = await openConfirmDialog({
          title: "确认价格为0",
          message: `${zeroAccountantPriceFields.map((field) => field.label).join("、")}为0，确认继续${editingRecordId ? "保存修改" : "提交"}？`,
          confirmText: "确认继续",
          cancelText: "返回修改",
          tone: "primary"
        });
        if (!confirmed) {
          const firstZeroField = zeroAccountantPriceFields[0];
          showInlineFormError({
            form: recordForm,
            hintSetter: setRecordFormHint,
            target: firstZeroField.input,
            message: `${zeroAccountantPriceFields.map((field) => field.label).join("、")}为0，请确认后再提交。`
          });
          return;
        }
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

        if (!editingRecordId && item.isMonthlySettlement && recordReminderDateInput?.value) {
          const reminderDate = String(recordReminderDateInput.value || "").trim();
          const orderNo = String(item.orderNo || "").trim();
          const customerWechat = String(item.customer || "").trim();
          if (reminderDate && orderNo && customerWechat) {
            try {
              await createReminder({
                date: reminderDate,
                orderNo,
                customerWechat
              });
            } catch (reminderError) {
              console.error("创建月结提醒失败:", reminderError);
            }
          }
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

        if (monthlySettlementCheckbox && recordReminderDateField) {
          monthlySettlementCheckbox.addEventListener("change", () => {
            if (monthlySettlementCheckbox.checked) {
              recordReminderDateField.hidden = false;
            } else {
              recordReminderDateField.hidden = true;
              if (recordReminderDateInput) {
                recordReminderDateInput.value = "";
              }
            }
          });
        }
        bindInlineValidation(completeForm, setCompleteFormHint);
        bindInlineValidation(invoiceUploadForm, setInvoiceUploadFormHint);
        bindInlineValidation(invoiceRecipientInfoForm, setInvoiceRecipientInfoHint);
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
        closeCustomerFeedbackModal();
        closeDispatcherModal();
        closeAccountantModal();
        closeAccountantRegisterModal();
        closeChangePasswordModal();
        closeRecycleModal();
        closeDevTodoModal();
        await loadSavedLoginEntries();
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
      } else if (shouldFocusLogin && !shouldSkipLoginAutoFocus()) {
        loginCodeInput.focus();
      }
    }

    init();
