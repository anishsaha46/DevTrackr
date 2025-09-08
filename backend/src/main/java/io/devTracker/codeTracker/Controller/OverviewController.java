package io.devTracker.codeTracker.Controller;

import io.devTracker.codeTracker.Dto.OverviewDTO;
import io.devTracker.codeTracker.Model.User;
import io.devTracker.codeTracker.Service.OverviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController  
@RequestMapping("/api/overview")  
public class OverviewController {

    @Autowired
    private OverviewService overviewService;
    @GetMapping
    public OverviewDTO.Summary getOverview(@AuthenticationPrincipal User user) {
        return overviewService.getOverview(user);
    }
}