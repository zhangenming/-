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

    completeModalCloseBtn.addEventListener("click", () => {
      closeCompleteModal();
    });

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
      renderAccountantPickerList(accountantPickerSearch.value);
      closeAccountantPicker({ focusTrigger: true });
    });

    sourcePickerList.addEventListener("click", (event) => {
      const optionButton = event.target.closest(".accountant-picker-option");
      if (!optionButton) return;
      const nextValue = String(optionButton.dataset.value || "").trim();
      setSourcePickerValue(nextValue);
      renderSourcePickerList();
      closeSourcePicker({ focusTrigger: true });
    });

    platformShopPickerList.addEventListener("click", (event) => {
      const optionButton = event.target.closest(".accountant-picker-option");
      if (!optionButton) return;
      const nextValue = String(optionButton.dataset.value || "").trim();
      setPlatformShopPickerValue(nextValue);
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

    filterMonthList.addEventListener("click", (event) => {
      const target = event.target.closest(".filter-option-btn");
      if (!target) return;
      const selected = target.dataset.filterValue || "";
      filterState.month = filterState.month === selected ? "" : selected;
      closeAllFilterPopovers();
      renderTable();
    });

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

    clearFilterBtn.addEventListener("click", () => {
      filterState.month = "";
      filterState.dispatcher = "";
      filterState.accountant = "";
      filterState.platform = "";
      filterState.shopName = "";
      filterState.source = "";
      filterState.status = "";
      closeAllFilterPopovers();
      renderTable();
    });

    accountantForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const username = String(accountantUsernameInput.value || "").trim();
      const displayName = String(accountantNameInput.value || "").trim();
      if (!username) {
        accountantUsernameInput.focus();
        return;
      }
      if (!displayName) {
        accountantNameInput.focus();
        return;
      }
      try {
        await createAccountant(username, displayName);
      } catch (error) {
        console.error(error);
        if (!username) {
          accountantUsernameInput.focus();
        } else {
          accountantNameInput.focus();
        }
        return;
      }
      accountantUsernameInput.value = "";
      accountantNameInput.value = "";
      accountantUsernameInput.focus();
    });

    checkForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!requireAccount()) return;
      if (!isAccountantLogin()) return;
      const recordId = String(checkRecordIdInput.value || "").trim();
      if (!recordId) return;
      const customer = String(checkCustomerInput.value || "").trim();
      const summary = String(checkSummaryInput.value || "").trim();
      if (!customer) {
        alert("客户为必填项。");
        checkCustomerInput.focus();
        return;
      }
      if (!summary) {
        alert("简介为必填项。");
        checkSummaryInput.focus();
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
        alert(error.message || "核对失败，请稍后重试。");
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
        alert("完工时间为必填项。");
        completeTimeInput.focus();
        return;
      }
      const completedAt = toISOStringFromDateTimeLocal(completedAtRaw);
      if (!completedAt) {
        alert("完工时间格式无效。");
        completeTimeInput.focus();
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
        alert(error.message || "状态更新失败，请稍后重试。");
        return;
      }
      closeCompleteModal();
    });

    accountantList.addEventListener("click", async (event) => {
      const deleteBtn = event.target.closest(".accountant-delete-btn");
      if (!deleteBtn) return;
      const accountantUsername = String(deleteBtn.dataset.accountantUsername || "").trim();
      const accountantDisplayName = String(deleteBtn.dataset.accountantDisplayName || "").trim();
      if (!accountantUsername || !accountantDisplayName) return;
      const relatedCount = Number(deleteBtn.dataset.relatedCount || 0);
      if (relatedCount > 0) {
        alert(`会计“${accountantDisplayName}”有 ${relatedCount} 条数据，先处理数据后再删除。`);
        return;
      }
      const confirmed = window.confirm(`确认删除会计“${accountantDisplayName}”？
用户名：${accountantUsername}`);
      if (!confirmed) return;
      try {
        await deleteAccountant(accountantUsername);
      } catch (error) {
        console.error(error);
        alert(error.message || "删除会计失败，请稍后重试。");
      }
    });

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
        if (checkAction === "view-feedback") {
          openCompleteModal(targetRecord, { mode: "view" });
          return;
        }
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
        if (isAccountantLogin()) return;
        const recordId = String(editBtn.dataset.recordId || "").trim();
        if (!recordId) return;
        const targetRecord = records.find((item) => String(item.id || "").trim() === recordId) || null;
        if (!targetRecord) return;
        openEditModal(targetRecord);
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
      const confirmed = window.confirm(`确认删除该条数据？\n日期：${date}\n客户：${customer}`);
      if (!confirmed) return;

      try {
        await deleteRecordById(recordId);
      } catch (error) {
        console.error(error);
        alert(error.message || "删除失败，请稍后重试。");
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

    recycleModal.addEventListener("click", (event) => {
      if (event.target === recycleModal) {
        closeRecycleModal();
      }
    });

    document.addEventListener("click", () => {
      closeAllFilterPopovers();
      closeAccountantPicker();
      closeSourcePicker();
      closePlatformShopPicker();
    });

    document.addEventListener("keydown", (event) => {
      if (!filterMonthPopover.hidden
        || !filterDispatcherPopover.hidden
        || !filterAccountantPopover.hidden
        || !filterPlatformPopover.hidden
        || !filterShopPopover.hidden
        || !filterSourcePopover.hidden
        || !filterStatusPopover.hidden) {
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
      if (event.key === "Escape" && !accountantModal.hidden) {
        closeAccountantModal();
        return;
      }
      if (event.key === "Escape" && !recycleModal.hidden) {
        closeRecycleModal();
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
      const item = {
        date: String(formData.get("date") || dateInput.value || getTodayISODate()).trim(),
        dispatcher: dispatcherInput.value || getDefaultDispatcherTag(),
        accountant: currentAccountantName || String(formData.get("accountant") || "").trim(),
        platform: String(formData.get("platform") || "").trim(),
        shopName: String(formData.get("shopName") || "").trim(),
        orderNo: String(formData.get("orderNo") || "").trim(),
        source: String(formData.get("source") || "").trim(),
        customer: String(formData.get("customer") || "").trim(),
        summary: String(formData.get("summary") || "").trim(),
        paymentPrice: Number(formData.get("paymentPrice")),
        totalPrice: Number(formData.get("totalPrice")),
        settlementPrice: Number(formData.get("settlementPrice"))
      };

      if (!item.accountant) {
        accountantPickerTrigger.focus();
        openAccountantPicker();
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
        alert(error.message || (editingRecordId ? "修改失败，请稍后重试。" : "保存失败，请稍后重试。"));
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
        status: "returned"
      };

      if (!item.accountant) {
        accountantPickerTrigger.focus();
        openAccountantPicker();
        return;
      }

      try {
        await updateRecordById(editingRecordId, item);
      } catch (error) {
        console.error(error);
        alert(error.message || "退单失败，请稍后重试。");
        return;
      }

      recordForm.reset();
      applyAccountToForm();
      closeCreateModal();
    });

    async function init() {
      initializeSuggestionGuard();
      closeCreateModal();
      closeCheckModal();
      closeCompleteModal();
      closeAnalysisModal();
      closeAccountantModal();
      closeRecycleModal();
      setLoginRequestHint("请求状态：待发送", "idle");
      localStorage.removeItem(STORAGE_KEY_OPERATION_NOTICE_DISMISSED_LEGACY);
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
